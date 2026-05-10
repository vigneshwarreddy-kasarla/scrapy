import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Vite/Webpack
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type Point = { lat: number; lng: number; label: string; color?: string };

type MapComponentProps = {
  points: Point[];
  center?: [number, number];
  zoom?: number;
};

export function MapComponent({ points, center, zoom = 13 }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = center || (points.length > 0 ? [points[0].lat, points[0].lng] : [0, 0]);
      mapInstanceRef.current = L.map(mapRef.current).setView(initialCenter as L.LatLngExpression, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);
    }

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    const bounds = L.latLngBounds([]);
    points.forEach((p) => {
      if (p.lat && p.lng) {
        const marker = L.marker([p.lat, p.lng])
          .addTo(mapInstanceRef.current!)
          .bindPopup(p.label);
        markersRef.current.push(marker);
        bounds.extend([p.lat, p.lng]);
      }
    });

    if (points.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (points.length === 1 && !center) {
      mapInstanceRef.current.setView([points[0].lat, points[0].lng], zoom);
    }

    return () => {
      // Cleanup if needed
    };
  }, [points, center, zoom]);

  return <div ref={mapRef} style={{ height: "300px", width: "100%", borderRadius: "8px", overflow: "hidden" }} />;
}
