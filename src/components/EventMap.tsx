import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface EventMapProps {
    location: string;
    venue?: string;
    title: string;
}

const EventMap = ({ location, venue, title }: EventMapProps) => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!location) return;

        const container = mapContainerRef.current;
        if (!container) return;

        // Cleanup existing map instance if it exists
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        try {
            // Initialize Map
            const map = L.map(container, {
                scrollWheelZoom: false,
                dragging: true
            }).setView([20.5937, 78.9629], 5); // Default to India

            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Force resize to ensure tiles load correctly
            const triggerResize = () => {
                map.invalidateSize();
            };

            // Multiple resize triggers to handle layout shifts/animations
            setTimeout(triggerResize, 0);
            setTimeout(triggerResize, 100);
            setTimeout(triggerResize, 500);

            // Coordinate Parsing (Latitude, Longitude)
            const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);

            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lng = parseFloat(coordMatch[2]);
                map.setView([lat, lng], 15);
                L.marker([lat, lng]).addTo(map)
                    .bindPopup(venue || title)
                    .openPopup();
            } else {
                // Geocoding Fallback
                const geocode = async (query: string) => {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                        const data = await response.json();
                        return data && data.length > 0 ? data[0] : null;
                    } catch (e) {
                        console.error("Geocoding error:", e);
                        return null;
                    }
                };

                geocode(location).then(result => {
                    if (result && mapRef.current) {
                        const lat = parseFloat(result.lat);
                        const lng = parseFloat(result.lon);
                        mapRef.current.setView([lat, lng], 15);
                        L.marker([lat, lng]).addTo(mapRef.current)
                            .bindPopup(venue || title)
                            .openPopup();
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing map:', error);
        }

        // Cleanup function
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [location, venue, title]);

    return (
        <div className="h-full w-full relative isolate z-10">
            <div
                ref={mapContainerRef}
                className="h-full w-full"
                style={{ minHeight: '100%', minWidth: '100%' }}
            />
        </div>
    );
};

export default EventMap;
