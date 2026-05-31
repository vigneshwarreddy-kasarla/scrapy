import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const pinIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });

export type GeoAddress = {
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
};

interface Props {
  onSelect: (addr: GeoAddress) => void;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
}

/* Inner: tracks clicks and draggable marker */
function ClickHandler({
  position,
  setPosition,
}: {
  position: L.LatLng | null;
  setPosition: (p: L.LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? (
    <Marker
      position={position}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend(e) {
          setPosition((e.target as L.Marker).getLatLng());
        },
      }}
    />
  ) : null;
}

/* Helper to center the map view when center coordinate updates */
function MapRecenter({ center }: { center: L.LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoAddress>> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = (await res.json()) as {
      address?: {
        road?: string;
        house_number?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
        country_code?: string;
      };
    };
    const a = data.address ?? {};
    const streetParts = [a.house_number, a.road, a.suburb].filter(Boolean);
    return {
      line1: streetParts.join(", ") || "Pin location",
      city: a.city ?? a.town ?? a.village ?? "",
      region: a.state ?? "",
      postalCode: a.postcode ?? "",
      country: (a.country_code ?? "IN").toUpperCase(),
    };
  } catch {
    return {};
  }
}

export function MapAddressPicker({ onSelect, onClose, initialLat = 17.385, initialLng = 78.4867 }: Props) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<L.LatLng | null>(null);
  const [preview, setPreview] = useState<Partial<GeoAddress> | null>(null);
  const [loading, setLoading] = useState(false);
  const geocodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-locate on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          setPosition(loc);
          setMapCenter(loc);
          setLoading(false);
        },
        (err) => {
          console.warn("Geolocation automatic lookup failed:", err);
          // Fallback to default coordinates
          const loc = new L.LatLng(initialLat, initialLng);
          setPosition(loc);
          setMapCenter(loc);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const loc = new L.LatLng(initialLat, initialLng);
      setPosition(loc);
      setMapCenter(loc);
    }
  }, [initialLat, initialLng]);

  // Geocode address lookup when pin position changes
  useEffect(() => {
    if (!position) return;
    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    geocodeTimeout.current = setTimeout(async () => {
      setLoading(true);
      const result = await reverseGeocode(position.lat, position.lng);
      setPreview(result);
      setLoading(false);
    }, 500);
  }, [position]);

  const handleLocateMe = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
        setPosition(loc);
        setMapCenter(loc);
        setLoading(false);
      },
      (err) => {
        alert("Could not get your current location: " + err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  function handleUse() {
    if (!position || !preview) return;
    onSelect({
      line1: preview.line1 ?? "",
      city: preview.city ?? "",
      region: preview.region ?? "",
      postalCode: preview.postalCode ?? "",
      country: preview.country ?? "IN",
      lat: position.lat,
      lng: position.lng,
    });
    onClose();
  }

  return (
    <div className="map-picker-overlay" role="dialog" aria-modal="true" aria-label="Pick address on map">
      <div className="map-picker-modal">
        <div className="map-picker-header">
          <h3 className="h3">📍 Pin Your Location</h3>
          <button className="map-picker-close linkish" onClick={onClose} aria-label="Close map picker">
            ✕
          </button>
        </div>
        <p className="small muted map-picker-hint">
          Click anywhere on the map to drop a pin. Drag the pin to adjust. We'll auto-fill your address.
        </p>
        <div className="map-picker-container">
          <MapContainer
            center={mapCenter || [initialLat, initialLng]}
            zoom={13}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler position={position} setPosition={setPosition} />
            {mapCenter && <MapRecenter center={mapCenter} />}
          </MapContainer>
        </div>

        <div className="map-picker-footer">
          {loading && <p className="small muted map-picker-geocoding">🔍 Finding address…</p>}
          {!loading && preview && position && (
            <div className="map-picker-preview">
              <span className="small">
                📍 {[preview.line1, preview.city, preview.region, preview.postalCode].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {!position && !loading && (
            <p className="small muted">No pin placed yet — click the map above.</p>
          )}
          <div className="row gap" style={{ flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className="btn-primary"
              disabled={!position || !preview || loading}
              onClick={handleUse}
            >
              ✔ Use This Location
            </button>
            <button
              type="button"
              className="btn-locate-me"
              onClick={handleLocateMe}
              title="Locate my current position"
            >
              🎯 Use Live Location
            </button>
            <button className="linkish" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
