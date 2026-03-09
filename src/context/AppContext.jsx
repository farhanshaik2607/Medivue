import { createContext, useContext, useReducer, useCallback } from 'react';
import { medicines } from '../data/medicines';
import { pharmacies } from '../data/pharmacies';
import { mockUser, orders as mockOrders } from '../data/users';
import { searchMedicines, getMedicineByIdFromApi } from '../services/openFdaService';
import { findNearbyPharmacies, getPharmaciesWithMedicineStock, simulateStock } from '../services/pharmacyService';

const AppContext = createContext();

const initialState = {
    user: mockUser,
    isLoggedIn: false,
    theme: localStorage.getItem('theme') || 'light',
    location: { lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bangalore', set: false },
    radius: 2,
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
    // Cache for API-fetched medicines (by ID)
    medicineCache: {},
};

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_LOGGED_IN':
            return { ...state, isLoggedIn: true, showSplash: false };
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
        case 'CACHE_MEDICINE':
            return { ...state, medicineCache: { ...state.medicineCache, [action.payload.id]: action.payload } };
        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', state.theme);
    }

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
        // Return real pharmacies if available, otherwise static
        if (state.nearbyRealPharmacies.length > 0) {
            return state.nearbyRealPharmacies.filter(p => p.distance <= state.radius);
        }
        return pharmacies.filter(p => p.distance <= state.radius).sort((a, b) => a.distance - b.distance);
    }, [state.radius, state.nearbyRealPharmacies]);

    const getMedicineById = useCallback((id) => {
        // Check cache first (for API-fetched medicines)
        if (state.medicineCache[id]) return state.medicineCache[id];
        // Check local
        const numId = parseInt(id);
        if (!isNaN(numId)) return medicines.find(m => m.id === numId);
        return null;
    }, [state.medicineCache]);

    const getPharmacyById = useCallback((id) => {
        // Check real pharmacies first
        const real = state.nearbyRealPharmacies.find(p => p.id === id);
        if (real) return real;
        // Fall back to static
        return pharmacies.find(p => p.id === parseInt(id));
    }, [state.nearbyRealPharmacies]);

    const getPharmaciesWithMedicine = useCallback((medId, medicineMrp = 100) => {
        const allPharmacies = state.nearbyRealPharmacies.length > 0
            ? state.nearbyRealPharmacies.filter(p => p.distance <= state.radius)
            : pharmacies.filter(p => p.distance <= state.radius);

        return getPharmaciesWithMedicineStock(allPharmacies, medId, medicineMrp);
    }, [state.radius, state.nearbyRealPharmacies]);

    // API-powered search
    const searchMedicinesAction = useCallback(async (query) => {
        if (!query || query.trim().length < 2) {
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
            return;
        }
        dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
        try {
            const results = await searchMedicines(query);
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
        } catch (error) {
            console.error('Search error:', error);
            dispatch({ type: 'SET_SEARCH_ERROR', payload: error.message });
        }
    }, []);

    // API-powered medicine detail fetch
    const fetchMedicineDetail = useCallback(async (id) => {
        // Check cache first
        if (state.medicineCache[id]) return state.medicineCache[id];
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
    }, [state.medicineCache]);

    // Fetch real nearby pharmacies
    const fetchNearbyPharmaciesAction = useCallback(async (lat, lng) => {
        dispatch({ type: 'SET_PHARMACIES_LOADING', payload: true });
        try {
            const results = await findNearbyPharmacies(lat, lng);
            dispatch({ type: 'SET_NEARBY_PHARMACIES', payload: results });
        } catch (error) {
            console.error('Pharmacy fetch error:', error);
            dispatch({ type: 'SET_NEARBY_PHARMACIES', payload: pharmacies.map(p => ({ ...p, source: 'local' })) });
        }
    }, []);

    const fetchLocation = useCallback(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    let city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
                    dispatch({ type: 'SET_LOCATION', payload: { lat: latitude, lng: longitude, address: data.display_name, city: city } });
                    // Also fetch nearby pharmacies when location is set
                    fetchNearbyPharmaciesAction(latitude, longitude);
                } catch (e) {
                    dispatch({ type: 'SET_LOCATION', payload: { lat: latitude, lng: longitude, address: 'Current Location', city: 'Current Location' } });
                    fetchNearbyPharmaciesAction(latitude, longitude);
                }
            }, (error) => {
                console.error("Error getting location: ", error);
                alert("Please enable location permissions to use auto-detect.");
            });
        } else {
            alert("Geolocation is not supported by your browser");
        }
    }, [fetchNearbyPharmaciesAction]);

    const value = {
        state, dispatch, addToCart, removeFromCart, updateCartQty,
        getCartTotal, getCartCount, getNearbyPharmacies, getMedicineById,
        getPharmacyById, getPharmaciesWithMedicine, fetchLocation,
        // New API-powered helpers
        searchMedicinesAction, fetchMedicineDetail, fetchNearbyPharmaciesAction,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
