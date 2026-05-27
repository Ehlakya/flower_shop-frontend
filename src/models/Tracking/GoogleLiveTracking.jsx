import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import socket from "../../services/socket";
import { useTracking } from "../../context/TrackingContext";
import "./Tracking.css";

// Fix for default Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const SHOP_LOCATION = [10.9984, 77.0308];

// Component to handle map auto-centering
function ChangeView({ center, focusLocation, isFollowing, globalLocation, isGlobalFollowing }) {
  const map = useMap();
  const lastFocusRef = useRef(null);

  useEffect(() => {
    // 1. Prioritize Global Follow (User's own GPS)
    if (globalLocation && isGlobalFollowing) {
      map.panTo([globalLocation.lat, globalLocation.lng], { animate: true, duration: 1.0 });
    }
    // 2. Handle manual focus triggers (From/To buttons)
    else if (focusLocation && focusLocation.timestamp !== lastFocusRef.current) {
      lastFocusRef.current = focusLocation.timestamp;
      map.flyTo([focusLocation.lat, focusLocation.lng], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
    // 3. Handle Order Driver follow
    else if (center && isFollowing) {
      map.panTo(center, { animate: true, duration: 1.0 });
    }
  }, [center, focusLocation, map, isFollowing, globalLocation, isGlobalFollowing]);

  return null;
}

const GoogleLiveTracking = ({ orderId, userId, role, customerLocation, initialAgentLocation, focusLocation, liveTrackingEnabled, isFollowing }) => {
  const { globalLocation, isGlobalFollowing, permissionError } = useTracking();
  const [currentPos, setCurrentPos] = useState(initialAgentLocation ? [initialAgentLocation.lat, initialAgentLocation.lng] : null);
  const [agentStatus, setAgentStatus] = useState('offline');
  const [route, setRoute] = useState([]);
  const [pathHistory, setPathHistory] = useState([SHOP_LOCATION]); // Path from shop to driver
  const [retryCount, setRetryCount] = useState(0);

  const lastFetchedPosRef = useRef(null);
  
  // 1. Fetch Route from CURRENT POSITION to DESTINATION
  useEffect(() => {
    if (customerLocation?.lat && customerLocation?.lng && currentPos) {
      // Avoid calling OSRM on every tiny movement (only if moved > 0.001 deg ~100m)
      if (lastFetchedPosRef.current) {
        const d = Math.sqrt(
          Math.pow(lastFetchedPosRef.current[0] - currentPos[0], 2) + 
          Math.pow(lastFetchedPosRef.current[1] - currentPos[1], 2)
        );
        if (d < 0.001 && route.length > 0) return;
      }

      const fetchRoute = async () => {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${currentPos[1]},${currentPos[0]};${customerLocation.lng},${customerLocation.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRoute(coords);
            lastFetchedPosRef.current = currentPos;
            setRetryCount(0); // Reset on success
          }
        } catch (err) {
          console.error("OSRM Route Error:", err);
          if (retryCount < 3) {
            setTimeout(() => setRetryCount(prev => prev + 1), 2000);
          } else {
            // Fallback to straight line
            setRoute([currentPos, [customerLocation.lat, customerLocation.lng]]);
          }
        }
      };
      fetchRoute();
    }
  }, [customerLocation, currentPos, retryCount, route.length]);

  // 2. Real-time updates via Socket.IO
  useEffect(() => {
    if (!liveTrackingEnabled) return;

    const handleUpdate = (data) => {
      if (orderId === "live" || data.orderId.toString() === orderId.toString()) {
        if (data.status === 'offline') {
          setAgentStatus('offline');
          return;
        }

        setAgentStatus('online');
        const newPos = [data.lat, data.lng];
        setCurrentPos(newPos);
        setPathHistory(prev => {
          const last = prev[prev.length - 1];
          const dist = Math.sqrt(Math.pow(last[0] - newPos[0], 2) + Math.pow(last[1] - newPos[1], 2));
          return dist > 0.0001 ? [...prev, newPos] : prev;
        });
      }
    };

    socket.on("deliveryLocationUpdate", handleUpdate);
    return () => socket.off("deliveryLocationUpdate", handleUpdate);
  }, [orderId, liveTrackingEnabled]);

  const bikeIcon = L.divIcon({
    html: `
        <div class="bike-marker-wrapper">
            <div class="bike-marker-pulse"></div>
            <img src="https://cdn-icons-png.flaticon.com/512/2964/2964514.png" style="width: 45px; height: 45px; position: relative; z-index: 2;" />
        </div>
    `,
    className: 'bike-icon-container',
    iconSize: [45, 45],
    iconAnchor: [22, 22]
  });

  const customerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });

  const shopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png', // Shop icon
    iconSize: [45, 45],
    iconAnchor: [22, 45]
  });

  // Calculate covered vs remaining route
  const getRouteSegments = () => {
    if (!route.length || !currentPos) return { covered: [], remaining: route };

    // Find index of point on route closest to currentPos
    let closestIdx = 0;
    let minSourceDist = Infinity;

    route.forEach((point, idx) => {
      const d = Math.sqrt(Math.pow(point[0] - currentPos[0], 2) + Math.pow(point[1] - currentPos[1], 2));
      if (d < minSourceDist) {
        minSourceDist = d;
        closestIdx = idx;
      }
    });

    return {
      covered: route.slice(0, closestIdx + 1),
      remaining: route.slice(closestIdx)
    };
  };

  const { covered, remaining } = getRouteSegments();

  return (
    <div className="leaflet-map-wrapper" style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={currentPos || (customerLocation ? [customerLocation.lat, customerLocation.lng] : SHOP_LOCATION)}
        zoom={15}
        style={{ height: "500px", width: "100%", borderRadius: "20px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <ChangeView
          center={currentPos}
          focusLocation={focusLocation}
          isFollowing={isFollowing}
          globalLocation={globalLocation}
          isGlobalFollowing={isGlobalFollowing}
        />

        {/* Global Personal GPS Marker */}
        {globalLocation && (
          <Marker position={[globalLocation.lat, globalLocation.lng]}>
            <Popup>You are here (Global GPS)</Popup>
          </Marker>
        )}

        {/* Path History (Shop to Driver) */}
        {pathHistory.length > 1 && (
          <Polyline positions={pathHistory} color="#10b981" weight={6} opacity={0.8} />
        )}

        {/* Dynamic Route (Driver to Destination) */}
        {route.length > 0 && (
          <Polyline positions={route} color="#6e45e2" weight={6} opacity={0.4} dashArray="10, 10" />
        )}

        {/* Customer Location */}
        {customerLocation && customerLocation.lat && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {/* Shop Location */}
        <Marker position={SHOP_LOCATION} icon={shopIcon}>
          <Popup>Starting Point</Popup>
        </Marker>

        {/* Moving Delivery Agent */}
        {currentPos && (
          <Marker position={currentPos} icon={bikeIcon}>
            <Popup>Delivery Partner</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="tracking-info-box">
        <div className={`info-badge ${agentStatus}`}>
          <span className={agentStatus === 'online' ? "pulse-dot online" : "pulse-dot offline"}></span>
          {agentStatus === 'online' ? "Agent Online (Live)" : "Agent Offline (Waiting...)"}
        </div>
        <div className="info-badge">
          <span className={liveTrackingEnabled ? "pulse-dot" : ""}></span>
          {liveTrackingEnabled ? "Live Tracking Active (Latest Order)" : "History View (Static)"}
        </div>
      </div>
    </div>
  );
};

export default GoogleLiveTracking;
