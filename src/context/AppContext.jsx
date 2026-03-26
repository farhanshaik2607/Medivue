import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile, getAllPharmaciesWithInventory } from '../services/firestoreService';
import { medicines } from '../data/medicines';
import { mockUser, orders as mockOrders } from '../data/users';
import { searchMedicines, getMedicineByIdFromApi } from '../services/openFdaService';

const AppContext = createContext();

const initialState = {
    user: mockUser,
    isLoggedIn: false,
    userRole: null, // 'user' | 'pharmacy' | null
    authLoading: true, // true until Firebase auth + Firestore role lookup complete
    theme: localStorage.getItem('theme') || 'light',
    location: { lat: 17.8484, lng: 78.6832, address: 'Gajwel, Siddipet District, Telangana', set: false },
    radius: 10,
    searchHistory: ['Dolo 650', 'Paracetamol', 'Vitamin D'],
    cart: [],
    prescriptions: [],
    orders: mockOrders,
    deliveryMode: 'delivery', // 'delivery' | 'pickup'
    selectedAddress: mockUser.addresses[0],
    showSplash: true,
    // New state for API-powered features
    searchResults: [],
    searchLoading: false,
    searchError: null,
    nearbyRealPharmacies: [],
    pharmaciesLoading: false,
    // Registered pharmacies from Firestore (with inventory)
    registeredPharmacies: [],
    registeredPharmaciesLoaded: false,
    // Cache for API-fetched medicines (by ID)
    medicineCache: {},
};

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_LOGGED_IN':
            return { ...state, isLoggedIn: true, showSplash: false };
        case 'SET_USER_ROLE':
            return { ...state, userRole: action.payload };
        case 'SET_AUTH_LOADING':
            return { ...state, authLoading: action.payload };
        case 'SET_USER':
            return {
                ...state,
                user: action.payload ? { ...state.user, ...action.payload } : mockUser,
                isLoggedIn: !!action.payload,
                showSplash: action.payload ? false : state.showSplash
            };
        case 'LOGOUT':
            return {
                ...state,
                user: mockUser,
                isLoggedIn: false,
                userRole: null,
                authLoading: false,
                cart: [], // Clear cart on logout
                showSplash: true
            };
        case 'SET_LOCATION':
            return { ...state, location: { ...action.payload, set: true } };
        case 'SET_RADIUS':
            return { ...state, radius: action.payload };
        case 'ADD_SEARCH_HISTORY':
            return { ...state, searchHistory: [action.payload, ...state.searchHistory.filter(s => s !== action.payload)].slice(0, 10) };
        case 'CLEAR_SEARCH_HISTORY':
            return { ...state, searchHistory: [] };
        case 'ADD_TO_CART': {
            const existing = state.cart.find(i => i.medId === action.payload.medId && i.pharmacyId === action.payload.pharmacyId);
            if (existing) {
                return { ...state, cart: state.cart.map(i => i.medId === action.payload.medId && i.pharmacyId === action.payload.pharmacyId ? { ...i, qty: i.qty + 1 } : i) };
            }
            return { ...state, cart: [...state.cart, { ...action.payload, qty: 1 }] };
        }
        case 'REMOVE_FROM_CART':
            return { ...state, cart: state.cart.filter(i => !(i.medId === action.payload.medId && i.pharmacyId === action.payload.pharmacyId)) };
        case 'UPDATE_CART_QTY':
            return { ...state, cart: state.cart.map(i => i.medId === action.payload.medId && i.pharmacyId === action.payload.pharmacyId ? { ...i, qty: action.payload.qty } : i).filter(i => i.qty > 0) };
        case 'CLEAR_CART':
            return { ...state, cart: [] };
        case 'SET_DELIVERY_MODE':
            return { ...state, deliveryMode: action.payload };
        case 'SET_SELECTED_ADDRESS':
            return { ...state, selectedAddress: action.payload };
        case 'ADD_PRESCRIPTION':
            return { ...state, prescriptions: [...state.prescriptions, action.payload] };
        case 'SKIP_SPLASH':
            return { ...state, showSplash: false };
        case 'TOGGLE_THEME': {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            return { ...state, theme: newTheme };
        }
        case 'TOGGLE_SAVED_MED': {
            const saved = state.user.savedMedicines;
            const newSaved = saved.includes(action.payload) ? saved.filter(id => id !== action.payload) : [...saved, action.payload];
            return { ...state, user: { ...state.user, savedMedicines: newSaved } };
        }
        case 'ADD_FAMILY_MEMBER':
            return { ...state, user: { ...state.user, familyMembers: [...state.user.familyMembers, action.payload] } };
        case 'ADD_ADDRESS':
            return { ...state, user: { ...state.user, addresses: [...state.user.addresses, action.payload] } };
        case 'ADD_DOCUMENT':
            return { ...state, user: { ...state.user, healthDocuments: [...state.user.healthDocuments, action.payload] } };
        // New actions for API-powered features
        case 'SET_SEARCH_LOADING':
            return { ...state, searchLoading: action.payload };
        case 'SET_SEARCH_RESULTS':
            return { ...state, searchResults: action.payload, searchLoading: false, searchError: null };
        case 'SET_SEARCH_ERROR':
            return { ...state, searchError: action.payload, searchLoading: false };
        case 'SET_PHARMACIES_LOADING':
            return { ...state, pharmaciesLoading: action.payload };
        case 'SET_NEARBY_PHARMACIES':
            return { ...state, nearbyRealPharmacies: action.payload, pharmaciesLoading: false };
        case 'SET_REGISTERED_PHARMACIES':
            return { ...state, registeredPharmacies: action.payload, registeredPharmaciesLoaded: true, pharmaciesLoading: false };
        case 'CACHE_MEDICINE':
            return { ...state, medicineCache: { ...state.medicineCache, [action.payload.id]: action.payload } };
        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Ref to coordinate between explicit login handlers and onAuthStateChanged
    // When a login handler (PharmacyLogin or Splash) sets this to true before calling
    // signIn, onAuthStateChanged will skip its own Firestore fetch and let the login
    // handler manage all state transitions. This prevents the race condition.
    const loginHandledRef = useRef(false);

    const markLoginHandled = useCallback(() => {
        loginHandledRef.current = true;
    }, []);

    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', state.theme);
    }

    // Firebase Auth State Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('[AppContext] Auth state changed. User:', currentUser ? currentUser.email : 'null');
            
            if (currentUser) {
                // If a login handler is already managing this auth change, skip
                if (loginHandledRef.current) {
                    console.log('[AppContext] Login is being handled manually, skipping listener.');
                    loginHandledRef.current = false;
                    return; // login handler will dispatch all state changes
                }
                
                // Normal flow: initial app load or page refresh
                console.log('[AppContext] Normal auth flow: fetching profile...');
                try {
                    const profile = await getUserProfile(currentUser.uid);
                    const role = profile?.role || 'user';
                    console.log('[AppContext] Profile fetched. Role:', role);
                    
                    dispatch({ type: 'SET_USER_ROLE', payload: role });
                    dispatch({
                        type: 'SET_USER',
                        payload: {
                            uid: currentUser.uid,
                            email: currentUser.email,
                            name: currentUser.displayName || profile?.name || currentUser.email.split('@')[0]
                        }
                    });
                } catch (err) {
                    console.error('[AppContext] Error fetching user profile:', err);
                    dispatch({
                        type: 'SET_USER',
                        payload: {
                            uid: currentUser.uid,
                            email: currentUser.email,
                            name: currentUser.displayName || currentUser.email.split('@')[0]
                        }
                    });
                } finally {
                    dispatch({ type: 'SET_AUTH_LOADING', payload: false });
                }
            } else {
                console.log('[AppContext] No user, logging out.');
                dispatch({ type: 'LOGOUT' });
                dispatch({ type: 'SET_AUTH_LOADING', payload: false });
            }
        });
        return () => unsubscribe();
    }, []);

    const addToCart = useCallback((medId, pharmacyId, name, price) => {
        dispatch({ type: 'ADD_TO_CART', payload: { medId, pharmacyId, name, price } });
    }, []);

    const removeFromCart = useCallback((medId, pharmacyId) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: { medId, pharmacyId } });
    }, []);

    const updateCartQty = useCallback((medId, pharmacyId, qty) => {
        dispatch({ type: 'UPDATE_CART_QTY', payload: { medId, pharmacyId, qty } });
    }, []);

    const getCartTotal = useCallback(() => {
        return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }, [state.cart]);

    const getCartCount = useCallback(() => {
        return state.cart.reduce((sum, item) => sum + item.qty, 0);
    }, [state.cart]);

    const getNearbyPharmacies = useCallback(() => {
        // Return registered Firestore pharmacies within radius
        return state.registeredPharmacies
            .filter(p => typeof p.distance === 'number' && p.distance <= state.radius)
            .sort((a, b) => a.distance - b.distance);
    }, [state.registeredPharmacies, state.radius]);

    const getMedicineById = useCallback((id) => {
        // Check cache first (for API-fetched medicines)
        if (state.medicineCache[id]) return state.medicineCache[id];
        // Check local
        const numId = parseInt(id);
        if (!isNaN(numId)) return medicines.find(m => m.id === numId);
        return null;
    }, [state.medicineCache]);

    const getPharmacyById = useCallback((id) => {
        // Check registered pharmacies from Firestore
        const found = state.registeredPharmacies.find(p => p.id === id);
        return found || null;
    }, [state.registeredPharmacies]);

    const getPharmaciesWithMedicine = useCallback((medId, medicineMrp = 100, medicineName = '') => {
        // Search registered pharmacies' real inventory for matching medicine
        const results = [];

        // Determine the medicine name to match against
        let medName = medicineName ? medicineName.toLowerCase().trim() : '';
        if (!medName) {
            const cached = state.medicineCache[medId];
            if (cached) medName = (cached.name || '').toLowerCase().trim();
            const numId = parseInt(medId);
            if (!isNaN(numId)) {
                const local = medicines.find(m => m.id === numId);
                if (local) medName = local.name.toLowerCase().trim();
            }
        }

        console.log('[getPharmaciesWithMedicine] Searching for:', medName, '| registeredPharmacies:', state.registeredPharmacies.length);

        for (const pharmacy of state.registeredPharmacies) {
            if (!pharmacy.inventory || pharmacy.inventory.length === 0) continue;

            // Match medicine by name (case-insensitive, flexible)
            const matchingItem = pharmacy.inventory.find(item => {
                const itemName = (item.name || '').toLowerCase().trim();
                if (!medName || !itemName) return false;

                // Exact match
                if (itemName === medName) return true;
                // Partial match (either direction)
                if (itemName.includes(medName) || medName.includes(itemName)) return true;
                // Word-level match: check if key words match (e.g. "Dolo" matches "Dolo 650")
                const medWords = medName.split(/\s+/);
                const itemWords = itemName.split(/\s+/);
                const keyWordMatch = medWords[0] && itemWords[0] && medWords[0] === itemWords[0];
                return keyWordMatch;
            });

            if (matchingItem && matchingItem.qty > 0) {
                console.log('[getPharmaciesWithMedicine] MATCH:', pharmacy.name, '->', matchingItem.name, 'qty:', matchingItem.qty, 'price:', matchingItem.price);
                results.push({
                    ...pharmacy,
                    medPrice: matchingItem.price || medicineMrp,
                    medQty: matchingItem.qty || 0,
                });
            }
        }

        // Filter by radius and sort by price
        const filteredResults = results.filter(p => typeof p.distance === 'number' && p.distance <= state.radius);
        console.log('[getPharmaciesWithMedicine] Found', filteredResults.length, 'pharmacies with stock nearby.');
        return filteredResults.sort((a, b) => a.medPrice - b.medPrice);
    }, [state.registeredPharmacies, state.medicineCache, state.radius]);

    // API-powered search
    const searchMedicinesAction = useCallback(async (query) => {
        if (!query || query.trim().length < 2) {
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
            return;
        }
        dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
        try {
            // 1. Get results from API / Local static list
            const results = await searchMedicines(query);
            
            // 2. Also search real registered pharmacies for custom products (Skin care, etc.)
            const q = query.toLowerCase().trim();
            const pharmacyCustomResults = [];
            const seenNames = new Set(results.map(r => r.name.toLowerCase()));
            
            for (const pharmacy of state.registeredPharmacies) {
                if (!pharmacy.inventory) continue;
                for (const item of pharmacy.inventory) {
                    const itemName = (item.name || '').toLowerCase();
                    if (itemName.includes(q) && !seenNames.has(itemName)) {
                        pharmacyCustomResults.push({
                            id: `pharma-${item.id}-${pharmacy.id}`,
                            name: item.name,
                            salt: item.salt || 'Pharmacy Exclusive',
                            category: item.category || 'General',
                            manufacturer: pharmacy.name,
                            packSize: item.packSize || '1 unit',
                            mrp: item.price || 0,
                            image: '🧴',
                            rating: pharmacy.rating || 4.5,
                            reviews: pharmacy.reviews || 10,
                            prescriptionRequired: false,
                            source: 'local', // treat as local so it shows "Near you"
                            isCustom: true
                        });
                        seenNames.add(itemName);
                    }
                }
            }
            
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: [...results, ...pharmacyCustomResults] });
        } catch (error) {
            console.error('Search error:', error);
            dispatch({ type: 'SET_SEARCH_ERROR', payload: error.message });
        }
    }, [state.registeredPharmacies]);

    // API-powered medicine detail fetch
    const fetchMedicineDetail = useCallback(async (id) => {
        // Check cache first
        if (state.medicineCache[id]) return state.medicineCache[id];
        
        // Handle pharma- prefixed custom items
        if (typeof id === 'string' && id.startsWith('pharma-')) {
            const parts = id.split('-');
            const phId = parts[2];
            const pharmacy = state.registeredPharmacies.find(p => p.id === phId);
            if (pharmacy && pharmacy.inventory) {
                const item = pharmacy.inventory.find(i => `pharma-${i.id}-${phId}` === id);
                if (item) {
                    const mapped = {
                        ...item,
                        id,
                        source: 'local',
                        manufacturer: pharmacy.name,
                        packSize: item.packSize || '1 unit',
                        mrp: item.price || 0,
                        image: '🧴',
                        rating: pharmacy.rating || 4.5,
                        reviews: pharmacy.reviews || 10,
                        prescriptionRequired: false,
                        description: item.description || 'Quality product available at ' + pharmacy.name,
                        uses: [item.category || 'Health & Wellness'],
                        sideEffects: ['No common side effects reported.'],
                        dosage: 'Use as directed on the label.'
                    };
                    dispatch({ type: 'CACHE_MEDICINE', payload: mapped });
                    return mapped;
                }
            }
        }

        // Check local
        const numId = parseInt(id);
        if (!isNaN(numId)) {
            const local = medicines.find(m => m.id === numId);
            if (local) return { ...local, source: 'local' };
        }
        // Fetch from API
        try {
            const med = await getMedicineByIdFromApi(id);
            if (med) {
                dispatch({ type: 'CACHE_MEDICINE', payload: med });
                return med;
            }
        } catch (error) {
            console.error('Medicine detail fetch error:', error);
        }
        return null;
    }, [state.medicineCache, state.registeredPharmacies]);

    // Helper: calculate distance between two coordinates (Haversine)
    const haversineDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const fetchRegisteredPharmacies = useCallback(async (userLat, userLng) => {
        dispatch({ type: 'SET_PHARMACIES_LOADING', payload: true });
        console.log('[fetchRegisteredPharmacies] Starting fetch for user location:', userLat, userLng);
        try {
            const results = await getAllPharmaciesWithInventory();
            console.log(`[fetchRegisteredPharmacies] Fetched ${results.length} pharmacies from Firestore.`);
            
            // Add distance from user location to each pharmacy
            const withDistance = results.map(p => {
                const pLat = p.lat || 0;
                const pLng = p.lng || 0;
                const distance = (pLat && pLng) ? haversineDistance(userLat, userLng, pLat, pLng) : 999;
                console.log(`[fetchRegisteredPharmacies] Pharmacy: ${p.name} | Lat: ${pLat}, Lng: ${pLng} | Distance: ${distance.toFixed(1)} km`);
                
                const walkTime = Math.round((distance / 5) * 60);
                const driveTime = Math.round((distance / 20) * 60);
                return {
                    ...p,
                    distance: Math.round(distance * 10) / 10,
                    walkTime,
                    driveTime,
                    isOpen: p.isOpen !== false,
                    openTime: p.openTime || '09:00',
                    closeTime: p.closeTime || '21:00',
                    rating: p.rating || 0,
                    reviews: p.reviews || 0,
                    deliveryAvailable: p.deliveryAvailable || false,
                    deliveryFee: p.deliveryFee || 0,
                    freeDeliveryAbove: p.freeDeliveryAbove || 0,
                };
            });
            console.log('[fetchRegisteredPharmacies] Pharmacies within radius:', withDistance.filter(p => p.distance <= state.radius).length);
            dispatch({ type: 'SET_REGISTERED_PHARMACIES', payload: withDistance });
        } catch (error) {
            console.error('Registered pharmacy fetch error:', error);
            dispatch({ type: 'SET_REGISTERED_PHARMACIES', payload: [] });
        }
    }, [state.radius]);

    // Fetch registered pharmacies and calculate distance on app load or location change
    useEffect(() => {
        if (!state.authLoading && state.user?.uid) {
            const lat = state.location?.lat || 17.8484;
            const lng = state.location?.lng || 78.6832;
            fetchRegisteredPharmacies(lat, lng);
        }
    }, [state.authLoading, state.user?.uid, state.location?.lat, state.location?.lng, fetchRegisteredPharmacies]);

    // Legacy compatibility — keep this alias
    const fetchNearbyPharmaciesAction = useCallback(async (lat, lng) => {
        await fetchRegisteredPharmacies(lat, lng);
    }, [fetchRegisteredPharmacies]);

    const fetchLocation = useCallback(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    let city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
                    dispatch({ type: 'SET_LOCATION', payload: { lat: latitude, lng: longitude, address: data.display_name, city: city } });
                    // Refetch pharmacies with new location for distance calc
                    fetchRegisteredPharmacies(latitude, longitude);
                } catch (e) {
                    dispatch({ type: 'SET_LOCATION', payload: { lat: latitude, lng: longitude, address: 'Current Location', city: 'Current Location' } });
                    fetchRegisteredPharmacies(latitude, longitude);
                }
            }, (error) => {
                console.error("Error getting location: ", error);
                alert("Please enable location permissions to use auto-detect.");
            });
        } else {
            alert("Geolocation is not supported by your browser");
        }
    }, [fetchRegisteredPharmacies]);

    const value = {
        state, dispatch, addToCart, removeFromCart, updateCartQty,
        getCartTotal, getCartCount, getNearbyPharmacies, getMedicineById,
        getPharmacyById, getPharmaciesWithMedicine, fetchLocation,
        // New API-powered helpers
        searchMedicinesAction, fetchMedicineDetail, fetchNearbyPharmaciesAction,
        // Auth coordination
        markLoginHandled,
    };

    // Global logout helper
    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            dispatch({ type: 'LOGOUT' });
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }, [dispatch]);

    return <AppContext.Provider value={{ ...value, handleLogout }}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
