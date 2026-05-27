import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import GoogleLiveTracking from "./GoogleLiveTracking";
import "./Tracking.css";

const SHOP_LOCATION = { lat: 10.9984, lng: 77.0308 };

function OrderTracking() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [bikeLocation, setBikeLocation] = useState(null);
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);
    const [focusLocation, setFocusLocation] = useState(null);
    const [isFollowing, setIsFollowing] = useState(true);
    const [latestOrderId, setLatestOrderId] = useState(null);

    // 1. Fetch Order & Initialize Socket
    useEffect(() => {
        if (!user) {
            navigate("/signin");
            return;
        }

        const fetchOrder = async () => {
            try {
                const response = await fetch("/api/orders/my-orders", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                });
                if (response.ok) {
                    const orders = await response.json();
                    if (orders.length > 0) {
                        // The API returns orders sorted by created_at DESC
                        const latest = orders[0].id;
                        setLatestOrderId(latest);
                        
                        const currentOrder = orders.find(o => o.id.toString() === id.toString() || id === "live");
                        if (currentOrder) {
                            setOrder(currentOrder);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching order:", err);
            }
        };

        fetchOrder();

        if (!socket.connected) socket.connect();
        socket.emit("joinRoom", `user_${user.id}`);

        const handleLocationUpdate = (data) => {
            // Live tracking only for the latest order
            const isLatestOrder = latestOrderId && data.orderId.toString() === latestOrderId.toString();
            const isCurrentOrder = order && data.orderId.toString() === order.id.toString();
            
            if (isLatestOrder && (id === "live" || isCurrentOrder)) {
                setBikeLocation({ lat: data.lat, lng: data.lng });
                
                if (order && order.latitude) {
                    const d = Math.sqrt(Math.pow(data.lat - order.latitude, 2) + Math.pow(data.lng - order.longitude, 2)) * 111;
                    setDistance(d.toFixed(1));
                    setEta(Math.ceil(d * 2) + 1);
                }
            }
        };

        const handleStatusUpdate = (data) => {
            const isCurrentOrder = order && data.orderId.toString() === order.id.toString();
            if (id === "live" || data.orderId.toString() === id.toString() || isCurrentOrder) {
                setOrder(prev => prev ? { ...prev, status: data.status } : null);
            }
        };

        socket.on("deliveryLocationUpdate", handleLocationUpdate);
        socket.on("orderStatusUpdate", handleStatusUpdate);

        return () => {
            socket.off("deliveryLocationUpdate", handleLocationUpdate);
            socket.off("orderStatusUpdate", handleStatusUpdate);
        };
    }, [id, user, navigate, order?.id, order?.latitude, order?.longitude, latestOrderId]);

    // Timeline Configuration
    const statuses = ["pending", "confirmed", "preparing", "out for delivery", "delivered"];
    const currentStatusIndex = statuses.indexOf(order?.status?.toLowerCase() || "pending");

    return (
        <div className="tracking-page">
            <div className="tracking-header">
                <h1>Live Tracking <span style={{color: '#94a3b8'}}>#{order?.id || id}</span></h1>
                <div className="status-indicator">
                    <div className="pulse"></div>
                    {order?.status === 'delivered' ? "Package Delivered!" : 
                     bikeLocation ? "Your order is on the way!" : "Waiting for pickup..."}
                </div>
            </div>

            <div className="status-timeline">
                {statuses.map((s, index) => (
                    <div key={s} className={`timeline-step ${index <= currentStatusIndex ? (index === currentStatusIndex ? 'active' : 'completed') : ''}`}>
                        <div className="step-icon">
                            {index < currentStatusIndex ? "✓" : index + 1}
                        </div>
                        <div className="step-label">{s.replace(/\b\w/g, l => l.toUpperCase())}</div>
                    </div>
                ))}
            </div>

            <div className="map-card">
                {/* Route Info Stats */}
                {order && order.latitude && (
                    <div className="route-stats-bar">
                        <div className="stat-item">
                            <label>Delivery To</label>
                            <strong>{order.customer?.name || user?.name}</strong>
                        </div>
                        <div className="stat-item separator"></div>
                        <div className="stat-item">
                            <label>Status</label>
                            <strong>{order.status?.toUpperCase()}</strong>
                        </div>
                    </div>
                )}

                <div className="map-container">
                    <div className="map-overlay-top">
                        <button 
                            className={`overlay-btn ${isFollowing ? 'active' : ''}`}
                            onClick={() => setIsFollowing(!isFollowing)}
                        >
                            <span className={`btn-dot ${isFollowing ? 'live' : 'static'}`}></span> 
                            {isFollowing ? "Following Driver" : "Follow Driver"}
                        </button>
                        <button 
                            className="overlay-btn" 
                            onClick={() => setFocusLocation({ lat: SHOP_LOCATION.lat, lng: SHOP_LOCATION.lng, timestamp: Date.now() })}
                        >
                            <span className="btn-dot start"></span> Starting Point
                        </button>
                        <button 
                            className="overlay-btn" 
                            onClick={() => {
                                if (order && order.latitude) {
                                    setFocusLocation({ lat: parseFloat(order.latitude), lng: parseFloat(order.longitude), timestamp: Date.now() });
                                }
                            }}
                        >
                            <span className="btn-dot end"></span> Destination
                        </button>
                    </div>

                    <GoogleLiveTracking 
                        orderId={order?.id || id} 
                        userId={user?.id} 
                        role="customer" 
                        customerLocation={order?.latitude ? { lat: parseFloat(order.latitude), lng: parseFloat(order.longitude) } : null}
                        initialAgentLocation={order?.agentLocation}
                        focusLocation={focusLocation}
                        liveTrackingEnabled={order && latestOrderId && order.id.toString() === latestOrderId.toString()}
                        isFollowing={isFollowing}
                    />

                    <div className="map-overlay">
                        <div className="overlay-item">
                            <label>Order ID</label>
                            <span className="status-badge">#{order?.id || id}</span>
                        </div>
                        <div className="overlay-item">
                            <label>Pincode</label>
                            <span>{order?.pincode_snapshot || '---'}</span>
                        </div>
                        
                        {eta && order?.status !== 'delivered' && (
                            <div className="eta-badge">
                                <strong>ETA: ~{eta} mins ({distance} km)</strong>
                                <div style={{fontSize: '0.7rem', opacity: 0.8}}>Live Tracking Active</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="tracking-footer">
                <button className="back-btn" onClick={() => navigate("/")}>Back to Dashboard</button>
            </div>
        </div>
    );
}

export default OrderTracking;
