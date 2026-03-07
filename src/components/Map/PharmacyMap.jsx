import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Clock, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './PharmacyMap.css';

// Fix typical Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;

const createUserIcon = () => {
    const html = `
        <div class="map-user-marker">
            <div class="map-user-pulse"></div>
            <div class="map-user-core"></div>
        </div>
    `;
    return L.divIcon({
        html,
        className: 'map-custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

const createPharmacyIcon = (inStock) => {
    const iconClass = inStock ? 'map-pharma-marker in-stock' : 'map-pharma-marker out-stock';
    const html = `
        <div class="${iconClass}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
        </div>
    `;
    return L.divIcon({
        html,
        className: 'map-custom-div-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
};

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function PharmacyMap({ pharmacies, userLocation, medId }) {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
        return <div className="map-placeholder glass-panel">Location not available</div>;
    }

    const center = [userLocation.lat, userLocation.lng];

    return (
        <div className="pharmacy-map-container">
            <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="leaflet-map">
                <ChangeView center={center} zoom={13} />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* User Location */}
                <Marker position={center} icon={createUserIcon()}>
                    <Popup className="glass-popup">
                        <div className="popup-content">
                            <strong>You are here</strong>
                            <p>{userLocation.address || 'Current Location'}</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Pharmacies */}
                {pharmacies.map(pharmacy => {
                    const stockInfo = pharmacy.stock[medId];
                    const inStock = stockInfo && stockInfo.inStock && stockInfo.qty > 0;

                    return (
                        <Marker
                            key={pharmacy.id}
                            position={[pharmacy.lat, pharmacy.lng]}
                            icon={createPharmacyIcon(inStock)}
                        >
                            <Popup className="glass-popup">
                                <div className="popup-pharmacy">
                                    <div className="popup-header">
                                        <h4>{pharmacy.name}</h4>
                                        <div className="popup-dist-badge">
                                            <Navigation size={10} /> {pharmacy.distance} km
                                        </div>
                                    </div>
                                    <p className="popup-address">{pharmacy.address}</p>

                                    {inStock ? (
                                        <div className="popup-stock in-stock">
                                            <div className="popup-price">
                                                <span>₹{stockInfo.price}</span>
                                            </div>
                                            <div className="popup-meta">
                                                <span className="stock-qty">{stockInfo.qty} in stock</span>
                                                <span className="walk-time"><Clock size={10} /> {pharmacy.walkTime} min walk</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="popup-stock out-stock">
                                            <div className="out-of-stock-msg">
                                                <AlertTriangle size={12} /> Out of Stock
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
