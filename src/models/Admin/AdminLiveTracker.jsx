import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import GoogleLiveTracking from "../Tracking/GoogleLiveTracking";
import { useTracking } from "../../context/TrackingContext";
import "../Tracking/Tracking.css";

const AdminLiveTracker = () => {
  const { id } = useParams(); // Order ID
  const { user } = useAuth();
  const { isBroadcasting, setIsBroadcasting, globalLocation } = useTracking();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/admin/all`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (response.ok) {
          const orders = await response.json();
          const currentOrder = orders.find(o => o.id.toString() === id.toString());
          if (currentOrder) {
            setOrder(currentOrder);
            if (currentOrder.coords) {
                // We'll use these for the initial route
            }
          }
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      }
    };

    if (!socket.connected) socket.connect();
    socket.emit("joinRoom", "admin_tracking");

    // Broadcasting Logic
    if (isBroadcasting && globalLocation) {
        socket.emit("agentLocationUpdate", {
            orderId: id,
            userId: order?.userId,
            lat: globalLocation.lat,
            lng: globalLocation.lng
        });

        if (order && order.coords) {
            const d = Math.sqrt(Math.pow(globalLocation.lat - order.coords.lat, 2) + Math.pow(globalLocation.lng - order.coords.lng, 2)) * 111;
            setDistance(d.toFixed(1));
            setEta(Math.ceil(d * 2) + 1);
        }
    }
  }, [id, isBroadcasting, globalLocation, order?.userId, order?.coords?.lat]);

  const handleToggleTracking = () => {
    setIsBroadcasting(!isBroadcasting);
  };

  if (!order) return <div className="loading-container">Loading Order Details...</div>;

  return (
    <div className="tracking-page">
      <div className="tracking-header">
        <h1>Admin Delivery Tracker 🏍️</h1>
        <p>Order: <strong>#{order.id}</strong> | Customer: <strong>{order.customer_name || "Unknown"}</strong></p>
      </div>

      <div className="tracking-controls" style={{ textAlign: "center", marginBottom: "20px" }}>
        <button 
          onClick={handleToggleTracking} 
          className={`tracking-btn ${isBroadcasting ? "stop" : "start"}`}
          style={{
            padding: "15px 40px",
            fontSize: "1.2rem",
            borderRadius: "50px",
            border: "none",
            cursor: "pointer",
            background: isBroadcasting ? "#ef4444" : "#10b981",
            color: "white",
            fontWeight: "bold",
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)"
          }}
        >
          {isBroadcasting ? "🛑 Stop Sharing Location" : "🚀 Start Delivery Journey"}
        </button>
        {isBroadcasting && (
          <div className="tracking-status" style={{ marginTop: "15px", color: "#10b981", fontWeight: "bold" }}>
            <span className="pulse"></span> Live Location Sharing Active (Global)
          </div>
        )}
      </div>

      <div className="map-card">
        <div className="map-container" style={{ position: "relative", height: "500px" }}>
            <div className="map-overlay-top">
                <button 
                    className={`overlay-btn ${isFollowing ? 'active' : ''}`}
                    onClick={() => setIsFollowing(!isFollowing)}
                >
                    <span className={`btn-dot ${isFollowing ? 'live' : 'static'}`}></span> 
                    {isFollowing ? "Following Agent" : "Follow Agent"}
                </button>
                <button 
                    className="overlay-btn" 
                    onClick={() => setFocusLocation({ lat: 10.9984, lng: 77.0308, timestamp: Date.now() })}
                >
                    <span className="btn-dot start"></span> Shop
                </button>
                <button 
                    className="overlay-btn" 
                    onClick={() => {
                        if (order && order.coords) {
                            setFocusLocation({ lat: order.coords.lat, lng: order.coords.lng, timestamp: Date.now() });
                        }
                    }}
                >
                    <span className="btn-dot end"></span> Destination
                </button>
            </div>

            <GoogleLiveTracking 
                orderId={order.id} 
                userId={order.userId} 
                role="admin" 
                customerLocation={order.coords} 
                focusLocation={focusLocation}
                liveTrackingEnabled={isBroadcasting}
                isFollowing={isFollowing}
            />

            <div className="map-overlay">
                <div className="overlay-item">
                    <label>Order ID</label>
                    <span className="status-badge">#{order.id}</span>
                </div>
                <div className="overlay-item">
                    <label>Customer</label>
                    <span>{order.customer.name}</span>
                </div>
                
                {isBroadcasting && eta && (
                    <div className="eta-badge">
                        <strong>Live: {distance}km away</strong>
                        <div style={{fontSize: '0.7rem', opacity: 0.8}}>ETA: ~{eta} mins</div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="tracking-footer" style={{ marginTop: "30px", textAlign: "center" }}>
        <button className="back-btn" onClick={() => navigate("/admin/orders")}>Back to Orders</button>
      </div>
    </div>
  );
};

export default AdminLiveTracker;
