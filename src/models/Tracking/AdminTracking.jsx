import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Tracking.css";

// Icons setup
const bikeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const shopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const SHOP_LOCATION = [10.9984, 77.0308];

function AdminTracking() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState({}); // { orderId: { lat, lng } }

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate("/signin");
            return;
        }

        if (!socket.connected) socket.connect();
        
        socket.emit("joinRoom", "admin_tracking");

        const handleUpdate = (data) => {
            setDeliveries(prev => ({
                ...prev,
                [data.orderId]: { lat: data.lat, lng: data.lng }
            }));
        };

        socket.on("deliveryLocationUpdate", handleUpdate);

        return () => {
            socket.off("deliveryLocationUpdate", handleUpdate);
        };
    }, [user, navigate]);

    return (
        <div className="tracking-page global-radar-view">
            <div className="tracking-header" style={{padding: '20px', background: 'white', marginBottom: 0}}>
                <h1>Admin LIVE Radar 📡</h1>
                <p>Monitoring all active delivery simulations across Mumbai</p>
            </div>

            <div className="map-container radar-map-full">
                <MapContainer center={SHOP_LOCATION} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={SHOP_LOCATION} icon={shopIcon}>
                        <Popup>FloraSurprise Hub</Popup>
                    </Marker>

                    {Object.entries(deliveries).map(([orderId, pos]) => (
                        <Marker key={orderId} position={[pos.lat, pos.lng]} icon={bikeIcon}>
                            <Popup>
                                <strong>Order #{orderId}</strong><br/>
                                In Transit
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

            </div>
        </div>
    );
}

export default AdminTracking;
