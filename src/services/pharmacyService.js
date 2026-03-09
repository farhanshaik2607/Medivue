import { GOOGLE_MAPS_API_KEY, GOOGLE_PLACES_URL, DEFAULT_PHARMACY_RADIUS_M, OVERPASS_API_URL } from './config';
import { pharmacies as staticPharmacies } from '../data/pharmacies';

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Estimate walk time from distance (avg walking speed ~5 km/h).
 */
function estimateWalkTime(distanceKm) {
    return Math.round((distanceKm / 5) * 60);
}

/**
 * Estimate drive time from distance (avg city speed ~20 km/h).
 */
function estimateDriveTime(distanceKm) {
    return Math.round((distanceKm / 20) * 60);
}

/**
 * Generate deterministic simulated stock for a pharmacy+medicine combination.
 * Uses a simple hash so the same pharmacy always shows the same stock for the same medicine.
 */
export function simulateStock(pharmacyId, medicineId, medicineMrp = 100) {
    // Create a deterministic pseudo-random from pharmacy+medicine IDs
    const idStr = `${pharmacyId}-${medicineId}`;
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        const char = idStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    hash = Math.abs(hash);

    // ~70% chance of being in stock
    const inStock = (hash % 10) < 7;

    // Price variation: -15% to +5% of MRP
    const priceVariation = ((hash % 20) - 15) / 100;
    const price = Math.max(Math.round(medicineMrp * (1 + priceVariation)), 5);

    // Quantity: 0-100
    const qty = inStock ? ((hash % 80) + 5) : 0;

    return { price, inStock, qty };
}

/**
 * Parse Google Places opening hours into simple open/close format.
 */
function parseOpeningHours(place) {
    const isOpen = place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow ?? true;

    let openTime = '09:00';
    let closeTime = '21:00';

    if (place.regularOpeningHours?.periods) {
        const today = new Date().getDay();
        const todayPeriod = place.regularOpeningHours.periods.find(p => p.open?.day === today);
        if (todayPeriod) {
            if (todayPeriod.open?.hour !== undefined) {
                openTime = `${String(todayPeriod.open.hour).padStart(2, '0')}:${String(todayPeriod.open.minute || 0).padStart(2, '0')}`;
            }
            if (todayPeriod.close?.hour !== undefined) {
                closeTime = `${String(todayPeriod.close.hour).padStart(2, '0')}:${String(todayPeriod.close.minute || 0).padStart(2, '0')}`;
            }
        }
    }

    return { isOpen, openTime, closeTime };
}

/**
 * Transform a Google Places result into our pharmacy shape.
 */
function transformPlaceToPharmacy(place, userLat, userLng, index) {
    const lat = place.location?.latitude || 0;
    const lng = place.location?.longitude || 0;
    const distance = haversineDistance(userLat, userLng, lat, lng);
    const { isOpen, openTime, closeTime } = parseOpeningHours(place);

    return {
        id: `gp-${place.id || index}`,
        name: place.displayName?.text || 'Pharmacy',
        address: place.formattedAddress || place.shortFormattedAddress || '',
        distance: Math.round(distance * 10) / 10,
        walkTime: estimateWalkTime(distance),
        driveTime: estimateDriveTime(distance),
        lat,
        lng,
        rating: place.rating || 4.0,
        reviews: place.userRatingCount || 0,
        isOpen,
        openTime,
        closeTime,
        phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
        deliveryAvailable: true, // Assume delivery available
        deliveryFee: 30,
        freeDeliveryAbove: 299,
        image: '🏪',
        googleMapsUri: place.googleMapsUri || '',
        source: 'google',
        stock: {}, // Stock will be simulated per medicine
    };
}

// ─── Overpass API (OpenStreetMap) Integration ──────────────────────────────────

/**
 * Transform an Overpass API element into our pharmacy shape.
 */
function transformOverpassToPharmacy(element, userLat, userLng, index) {
    const lat = element.lat || (element.center && element.center.lat) || 0;
    const lng = element.lon || (element.center && element.center.lon) || 0;
    const tags = element.tags || {};

    const distance = haversineDistance(userLat, userLng, lat, lng);

    // Extract name – prefer name, fall back to operator, brand, etc.
    const name = tags.name || tags['name:en'] || tags.operator || tags.brand || 'Medical Store';

    // Build address from OSM tags
    const addressParts = [];
    if (tags['addr:housename']) addressParts.push(tags['addr:housename']);
    if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
    if (tags['addr:street']) addressParts.push(tags['addr:street']);
    if (tags['addr:city'] || tags['addr:village'] || tags['addr:town']) {
        addressParts.push(tags['addr:city'] || tags['addr:village'] || tags['addr:town']);
    }
    if (tags['addr:district']) addressParts.push(tags['addr:district']);
    if (tags['addr:state']) addressParts.push(tags['addr:state']);
    if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);

    const address = addressParts.length > 0
        ? addressParts.join(', ')
        : (tags['addr:full'] || `Near ${tags['addr:street'] || 'your location'}`);

    // Parse opening hours if available
    let isOpen = true;
    let openTime = '09:00';
    let closeTime = '21:00';
    if (tags.opening_hours) {
        // Simple check for "24/7"
        if (tags.opening_hours.includes('24/7')) {
            openTime = '24hrs';
            closeTime = '24hrs';
        }
        // Try to detect if currently closed based on common patterns
        const now = new Date();
        const currentHour = now.getHours();
        // Rough heuristic: Most Indian medical shops are open 8am-10pm
        isOpen = currentHour >= 8 && currentHour < 22;
    }

    // Phone
    const phone = tags.phone || tags['contact:phone'] || '';

    return {
        id: `osm-${element.id || index}`,
        name,
        address,
        distance: Math.round(distance * 10) / 10,
        walkTime: estimateWalkTime(distance),
        driveTime: estimateDriveTime(distance),
        lat,
        lng,
        rating: 4.0 + (Math.abs((element.id || index) % 10) / 10), // Deterministic pseudo-rating
        reviews: Math.abs((element.id || 0) % 200) + 10,
        isOpen,
        openTime,
        closeTime,
        phone,
        deliveryAvailable: distance < 3,
        deliveryFee: 30,
        freeDeliveryAbove: 299,
        image: '🏪',
        googleMapsUri: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        source: 'overpass',
        stock: {}, // Stock will be simulated per medicine
    };
}

/**
 * Fetch nearby pharmacies from the Overpass API (OpenStreetMap).
 * Searches for amenity=pharmacy, shop=chemist, and healthcare=pharmacy within the radius.
 * Free – no API key required.
 */
async function findNearbyPharmaciesOverpass(lat, lng, radiusM = DEFAULT_PHARMACY_RADIUS_M) {
    // Overpass QL query: find pharmacies, chemists, and medical shops nearby
    const query = `
        [out:json][timeout:15];
        (
            node["amenity"="pharmacy"](around:${radiusM},${lat},${lng});
            way["amenity"="pharmacy"](around:${radiusM},${lat},${lng});
            node["shop"="chemist"](around:${radiusM},${lat},${lng});
            way["shop"="chemist"](around:${radiusM},${lat},${lng});
            node["healthcare"="pharmacy"](around:${radiusM},${lat},${lng});
            way["healthcare"="pharmacy"](around:${radiusM},${lat},${lng});
            node["name"~"medical|pharma|chemist|aushadhi|medplus|apollo",i](around:${radiusM},${lat},${lng})["shop"];
            node["name"~"medical|pharma|chemist|aushadhi|medplus|apollo",i](around:${radiusM},${lat},${lng})["amenity"];
        );
        out center body;
    `;

    const response = await fetch(OVERPASS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
        // Deduplicate by proximity (some entries may refer to the same physical store)
        const seen = new Set();
        const unique = data.elements.filter(el => {
            const elLat = el.lat || (el.center && el.center.lat);
            const elLng = el.lon || (el.center && el.center.lon);
            if (!elLat || !elLng) return false;
            // Use a rounded lat/lng key to deduplicate very close entries
            const key = `${Math.round(elLat * 1000)},${Math.round(elLng * 1000)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return unique
            .map((el, i) => transformOverpassToPharmacy(el, lat, lng, i))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 20); // Cap at 20 results
    }

    return []; // No results
}

// ─── Main Entry Point ──────────────────────────────────────────────────────────

/**
 * Fetch nearby pharmacies. Tries in order:
 * 1. Google Places API (if key is configured)
 * 2. Overpass API (free, OpenStreetMap)
 * 3. Static fallback data
 */
export async function findNearbyPharmacies(lat, lng, radiusM = DEFAULT_PHARMACY_RADIUS_M) {
    // 1. Try Google Places API if key is configured
    if (GOOGLE_MAPS_API_KEY) {
        try {
            const response = await fetch(GOOGLE_PLACES_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': [
                        'places.id', 'places.displayName', 'places.formattedAddress',
                        'places.shortFormattedAddress', 'places.location', 'places.rating',
                        'places.userRatingCount', 'places.currentOpeningHours',
                        'places.regularOpeningHours', 'places.nationalPhoneNumber',
                        'places.internationalPhoneNumber', 'places.googleMapsUri',
                    ].join(','),
                },
                body: JSON.stringify({
                    includedTypes: ['pharmacy'],
                    maxResultCount: 15,
                    locationRestriction: {
                        circle: {
                            center: { latitude: lat, longitude: lng },
                            radius: radiusM,
                        },
                    },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.places && data.places.length > 0) {
                    return data.places
                        .map((place, i) => transformPlaceToPharmacy(place, lat, lng, i))
                        .sort((a, b) => a.distance - b.distance);
                }
            }
        } catch (error) {
            console.warn('Google Places API error:', error);
        }
    }

    // 2. Try Overpass API (free, OpenStreetMap)
    try {
        console.info('Fetching real pharmacies from Overpass API (OpenStreetMap)...');
        const overpassResults = await findNearbyPharmaciesOverpass(lat, lng, radiusM);
        if (overpassResults.length > 0) {
            console.info(`Found ${overpassResults.length} real pharmacies nearby via Overpass API`);
            return overpassResults;
        }
        console.info('No Overpass results found. Using static data with adjusted coordinates.');
    } catch (error) {
        console.warn('Overpass API error, falling back to static data:', error);
    }

    // 3. Fall back to static pharmacies (with coordinates adjusted to user location)
    return staticPharmacies.map((p, i) => {
        // Spread pharmacies around the user's location (within ~2 km)
        const angle = (i / staticPharmacies.length) * 2 * Math.PI;
        const spreadKm = 0.5 + (i % 3) * 0.6; // 0.5 to 1.7 km
        const offsetLat = (spreadKm / 111) * Math.cos(angle);
        const offsetLng = (spreadKm / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);

        const newLat = lat + offsetLat;
        const newLng = lng + offsetLng;
        const distance = haversineDistance(lat, lng, newLat, newLng);

        return {
            ...p,
            lat: newLat,
            lng: newLng,
            distance: Math.round(distance * 10) / 10,
            walkTime: estimateWalkTime(distance),
            driveTime: estimateDriveTime(distance),
            source: 'local',
        };
    });
}

/**
 * Get pharmacies that have a specific medicine in stock.
 * Works with both real (Google/Overpass) and static pharmacies.
 */
export function getPharmaciesWithMedicineStock(pharmacies, medicineId, medicineMrp = 100) {
    return pharmacies
        .map(pharmacy => {
            // For static pharmacies, use existing stock data
            if (pharmacy.source === 'local' && pharmacy.stock[medicineId]) {
                const stockInfo = pharmacy.stock[medicineId];
                return stockInfo.inStock
                    ? { ...pharmacy, medPrice: stockInfo.price, medQty: stockInfo.qty }
                    : null;
            }

            // For Google/Overpass pharmacies or local without specific stock, simulate
            const stockInfo = simulateStock(pharmacy.id, medicineId, medicineMrp);
            if (stockInfo.inStock) {
                return { ...pharmacy, medPrice: stockInfo.price, medQty: stockInfo.qty };
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.medPrice - b.medPrice);
}
