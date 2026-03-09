import { GOOGLE_MAPS_API_KEY, GOOGLE_PLACES_URL, DEFAULT_PHARMACY_RADIUS_M } from './config';
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

/**
 * Fetch nearby pharmacies from Google Maps Places API.
 * Falls back to static pharmacies if API key is not configured.
 */
export async function findNearbyPharmacies(lat, lng, radiusM = DEFAULT_PHARMACY_RADIUS_M) {
    // If no API key, fall back to static pharmacies
    if (!GOOGLE_MAPS_API_KEY) {
        console.info('No Google Maps API key configured. Using static pharmacy data.');
        return staticPharmacies.map(p => ({ ...p, source: 'local' }));
    }

    try {
        const response = await fetch(GOOGLE_PLACES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': [
                    'places.id',
                    'places.displayName',
                    'places.formattedAddress',
                    'places.shortFormattedAddress',
                    'places.location',
                    'places.rating',
                    'places.userRatingCount',
                    'places.currentOpeningHours',
                    'places.regularOpeningHours',
                    'places.nationalPhoneNumber',
                    'places.internationalPhoneNumber',
                    'places.googleMapsUri',
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

        if (!response.ok) {
            throw new Error(`Google Places API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.places && data.places.length > 0) {
            return data.places
                .map((place, i) => transformPlaceToPharmacy(place, lat, lng, i))
                .sort((a, b) => a.distance - b.distance);
        }

        // No results — fall back to static
        return staticPharmacies.map(p => ({ ...p, source: 'local' }));
    } catch (error) {
        console.warn('Google Places API error, falling back to static data:', error);
        return staticPharmacies.map(p => ({ ...p, source: 'local' }));
    }
}

/**
 * Get pharmacies that have a specific medicine in stock.
 * Works with both real (Google) and static pharmacies.
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

            // For Google pharmacies or local without specific stock, simulate
            const stockInfo = simulateStock(pharmacy.id, medicineId, medicineMrp);
            if (stockInfo.inStock) {
                return { ...pharmacy, medPrice: stockInfo.price, medQty: stockInfo.qty };
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.medPrice - b.medPrice);
}
