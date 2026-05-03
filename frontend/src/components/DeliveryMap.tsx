import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-geosearch/dist/geosearch.css";
import "leaflet-routing-machine";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";

// Fix standard leaflet icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom rider icon
const riderIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// A child component to handle Geosearch and Routing on the map
function RoutingMachine({ riderPos, restaurantPos }: { riderPos: L.LatLngTuple | null; restaurantPos: L.LatLngTuple }) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  // Setup GeoSearch
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: "bar",
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Enter delivery address"
    });
    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  // Setup Routing
  useEffect(() => {
    if (!riderPos || !map) return;
    
    if (routingControlRef.current) {
        routingControlRef.current.getPlan().setWaypoints([
            L.latLng(restaurantPos[0], restaurantPos[1]),
            L.latLng(riderPos[0], riderPos[1])
        ]);
        return;
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(restaurantPos[0], restaurantPos[1]),
        L.latLng(riderPos[0], riderPos[1])
      ],
      lineOptions: {
        styles: [{ color: '#f97316', weight: 4, opacity: 0.7, dashArray: "10, 10" }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false
    }).addTo(map);

    routingControlRef.current = routingControl;

    return () => {
        if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }
    }
  }, [map, riderPos, restaurantPos]);

  return null;
}

interface DeliveryMapProps {
  restaurantPos?: [number, number]; // [lat, lng]
}

export default function DeliveryMap({ restaurantPos = [40.7128, -74.0060] }: DeliveryMapProps) {
  const [riderPos, setRiderPos] = useState<[number, number] | null>(null);
  
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setRiderPos([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location: ", error);
          // Fallback to a point somewhat near restaurant if failed
          setRiderPos([restaurantPos[0] + 0.01, restaurantPos[1] + 0.01]);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
        setRiderPos([restaurantPos[0] + 0.01, restaurantPos[1] + 0.01]);
    }
  }, [restaurantPos]);

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer 
        center={restaurantPos} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={restaurantPos}>
          <Popup>Restaurant Location</Popup>
        </Marker>
        {riderPos && (
          <Marker position={riderPos} icon={riderIcon}>
            <Popup>Delivery Rider</Popup>
          </Marker>
        )}
        <RoutingMachine riderPos={riderPos} restaurantPos={restaurantPos} />
      </MapContainer>
    </div>
  );
}
