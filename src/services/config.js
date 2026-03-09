// API Configuration
// OpenFDA - Free, no key required
export const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/label.json';

// Google Maps Places API - Requires API key
// Get your key at: https://console.cloud.google.com/apis/credentials
// Enable "Places API (New)" in your Google Cloud project
export const GOOGLE_MAPS_API_KEY = ''; // TODO: Add your Google Maps API key here

export const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';

// Search debounce delay in milliseconds
export const SEARCH_DEBOUNCE_MS = 300;

// Default search radius for pharmacies (in meters)
export const DEFAULT_PHARMACY_RADIUS_M = 5000;

// Overpass API (OpenStreetMap) – free, no key required
export const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
