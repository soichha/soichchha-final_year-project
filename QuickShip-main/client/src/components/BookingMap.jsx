import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';

const BookingMap = ({ onSelect, selectionMode = 'none', existingPoints }) => {
   
    const [center] = useState([27.7172, 85.3240]);

    const MapEvents = () => {
        useMapEvents({
            async click(e) {
                if (selectionMode !== 'none') {
                    try {
                        const { lat, lng } = e.latlng;
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
                        const data = await response.json();

                        if (data.address && data.address.country_code === 'np') {
                            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown Location';
                            const district = data.address.state_district || data.address.state || 'Unknown District';

                            onSelect({ lat, lng, city, district, name: data.display_name });
                        } else {
                            alert("Service is available in Nepal only. Please select a location within Nepal.");
                        }
                    } catch (error) {
                        console.error("Geocoding failed", error);
                        onSelect(e.latlng);
                    }
                }
            },
        });
        return null;
    };

    return (
        <div className="h-full w-full relative z-0 text-slate-800">
            <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents />

                {existingPoints.source && (
                    <Marker position={existingPoints.source}>
                        <Popup>Source Location</Popup>
                    </Marker>
                )}

                {existingPoints.destination && (
                    <Marker position={existingPoints.destination}>
                        <Popup>Destination Location</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default BookingMap;
