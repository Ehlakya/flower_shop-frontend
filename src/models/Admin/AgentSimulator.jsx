import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AdminTracking.css";

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

function MapEvents({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
}

const AgentSimulator = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [agentPos, setAgentPos] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch("/api/orders/admin/all", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setOrders(data.filter(o => o.status !== 'delivered'));
                }
            } catch (err) {
                console.error("Error fetching orders:", err);
            }
        };

        fetchOrders();
        if (!socket.connected) socket.connect();
    }, [navigate]);

    const handleMapClick = (latlng) => {
        if (!selectedOrder) {
            alert("Please select an order first!");
            return;
        }
        setAgentPos([latlng.lat, latlng.lng]);
        sendLocationUpdate(latlng.lat, latlng.lng);
    };

    const sendLocationUpdate = (lat, lng) => {
        if (selectedOrder) {
            socket.emit("agentLocationUpdate", {
                orderId: selectedOrder.id,
                userId: selectedOrder.userId,
                lat,
                lng
            });
            console.log("📡 Sent location update:", { lat, lng });
        }
    };

    const startAutoSim = () => {
        if (!selectedOrder || !selectedOrder.coords) return;
        setIsSimulating(true);
        
        const start = SHOP_LOCATION;
        const end = [selectedOrder.coords.lat, selectedOrder.coords.lng];
        
        let currentLat = start[0];
        let currentLng = start[1];
        const steps = 100;
        const latStep = (end[0] - start[0]) / steps;
        const lngStep = (end[1] - start[1]) / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentLat += latStep;
            currentLng += lngStep;
            currentStep++;

            setAgentPos([currentLat, currentLng]);
            sendLocationUpdate(currentLat, currentLng);

            if (currentStep >= steps) {
                clearInterval(interval);
                setIsSimulating(false);
                alert("Simulation Finished!");
            }
        }, 800);
    };

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

    return (
        <div className="admin-simulator">
            <div className="simulator-header">
                <h1>Delivery Agent Simulator 🏍️</h1>
                <p>Click on the map to manually move the agent or use Auto-Simulation.</p>
            </div>

            <div className="simulator-controls" style={{padding: '20px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0'}}>
                <label style={{fontWeight: 'bold', marginRight: '10px'}}>Select Active Order: </label>
                <select 
                    onChange={(e) => {
                        const order = orders.find(o => o.id.toString() === e.target.value);
                        setSelectedOrder(order);
                        setAgentPos(null);
                    }}
                    value={selectedOrder?.id || ""}
                    style={{padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                >
                    <option value="">-- Select Order --</option>
                    {orders.map(o => (
                        <option key={o.id} value={o.id}>Order #{o.id} - {o.customer.name}</option>
                    ))}
                </select>

                {selectedOrder && (
                    <button 
                        onClick={startAutoSim} 
                        disabled={isSimulating}
                        style={{
                            marginLeft: '20px',
                            padding: '10px 20px', 
                            background: '#10b981', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                        }}
                    >
                        {isSimulating ? "🚀 Simulating..." : "🚀 Start Auto-Route Simulation"}
                    </button>
                )}
            </div>

            <div style={{height: '550px', width: '100%', borderRadius: '20px', overflow: 'hidden', border: '2px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}}>
                <MapContainer center={SHOP_LOCATION} zoom={13} style={{height: '100%', width: '100%'}}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <MapEvents onMapClick={handleMapClick} />
                    
                    <Marker position={SHOP_LOCATION}>
                        <Popup>Shop Hub</Popup>
                    </Marker>
                    
                    {selectedOrder && selectedOrder.coords && (
                        <Marker position={[selectedOrder.coords.lat, selectedOrder.coords.lng]}>
                            <Popup>Customer</Popup>
                        </Marker>
                    )}

                    {agentPos && (
                        <Marker position={agentPos} icon={bikeIcon}>
                            <Popup>Agent</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default AgentSimulator;
