import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaSatellite, FaBoxOpen, FaMapMarkerAlt } from 'react-icons/fa';
import './AdminTracking.css';

// Admin specific icons
const riderIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3144/3144510.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

const destIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1275/1275214.png',
  iconSize: [25, 25],
  iconAnchor: [12, 25]
});

const SHOP_LOCATION = { lat: 10.9984, lng: 77.0308 };

// Helper to center the map on a specific order
const MapController = ({ focusCoord }) => {
  const map = useMap();
  useEffect(() => {
    if (focusCoord) {
      map.flyTo([focusCoord.lat, focusCoord.lng], 16, { duration: 1.5 });
    }
  }, [focusCoord, map]);
  return null;
};

const AdminTracking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [riderLocations, setRiderLocations] = useState({}); // { orderId: {lat, lng} }
  const [loading, setLoading] = useState(true);
  const [focusCoord, setFocusCoord] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/signin');
      return;
    }

    const fetchActiveOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/orders/admin/all", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await response.json();
        
        // Ensure data is an array before filtering
        if (Array.isArray(data)) {
            const active = data.filter(o => o.status === 'shipping' || o.status === 'confirmed');
            setOrders(active);
            
            // Initialize rider locations
            const locations = {};
            active.forEach(o => {
                locations[o.id] = o.status === 'shipping' ? SHOP_LOCATION : o.coords;
            });
            setRiderLocations(locations);
        } else {
            console.warn("Logistics Radar: Received non-array data", data);
            setOrders([]);
        }
      } catch (err) {
        console.error("Fetch Active Orders Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();

    // Socket.io for admin tracking
    if (!socket.connected) socket.connect();
    socket.emit('joinRoom', 'admin_tracking');

    socket.on('deliveryLocationUpdate', (data) => {
      console.log('📡 Global Logistics Update:', data);
      setRiderLocations(prev => ({
        ...prev,
        [data.orderId]: { lat: data.lat, lng: data.lng }
      }));
    });

    socket.on('orderStatusUpdate', (data) => {
        // If an order is delivered, we might want to remove it from the map
        if (data.status === 'delivered') {
            setOrders(prev => prev.filter(o => o.id !== data.orderId));
        }
    });

    return () => {
      socket.off('deliveryLocationUpdate');
      socket.off('orderStatusUpdate');
    };
  }, [user, navigate]);

  const handleFocus = (order) => {
      const loc = riderLocations[order.id] || order.coords;
      setFocusCoord(loc);
  };

  if (loading) return <div className="admin-tracking-loading">Initializing Global Radar...</div>;

  return (
    <div className="admin-tracking-page">
      <div className="tracking-sidebar">
        <div className="sidebar-header">
           <button onClick={() => navigate('/admin')} className="back-link"><FaArrowLeft /> Dashboard</button>
           <h2><FaSatellite style={{color: '#6e45e2'}}/> Live Radar</h2>
           <p className="active-count">{orders.length} Active Deliveries</p>
        </div>

        <div className="order-list">
          {orders.map(order => (
            <div 
                key={order.id} 
                className="order-tracking-card"
                onClick={() => handleFocus(order)}
            >
              <div className="card-top">
                <span className="order-id">#{order.id}</span>
                <span className={`status-tag ${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
              <p className="customer-name">{order.customer.name}</p>
              <p className="address-mini">{order.customer.address}</p>
              <div className="action-row">
                  <button className="focus-btn"><FaMapMarkerAlt /> Locate</button>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="no-active">No orders are currently in transit.</div>}
        </div>
      </div>

      <div className="global-map-container">
        <MapContainer center={SHOP_LOCATION} zoom={12} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Shop Marker */}
          <Marker position={[SHOP_LOCATION.lat, SHOP_LOCATION.lng]} icon={L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/606/606395.png',
              iconSize: [30, 30]
          })}>
            <Popup>Main Shop</Popup>
          </Marker>

          {/* Active Order Markers */}
          {orders.map(order => {
            const rLoc = riderLocations[order.id];
            if (!rLoc) return null;
            
            return (
              <React.Fragment key={order.id}>
                {/* Rider Marker */}
                <Marker position={[rLoc.lat, rLoc.lng]} icon={riderIcon}>
                  <Tooltip permanent direction="top" offset={[0, -35]}>
                      <b>Order #{order.id}</b>
                  </Tooltip>
                  <Popup>
                    <div className="popup-content">
                        <h4>Order #{order.id}</h4>
                        <p><b>Customer:</b> {order.customer.name}</p>
                        <p><b>Rider:</b> Rahul</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Destination Marker */}
                <Marker position={[order.coords.lat, order.coords.lng]} icon={destIcon} opacity={0.6}>
                   <Popup>Destination for #{order.id}</Popup>
                </Marker>

                {/* Dynamic path line */}
                <Polyline 
                    positions={[[rLoc.lat, rLoc.lng], [order.coords.lat, order.coords.lng]]} 
                    color="#4caf50" 
                    dashArray="5, 10" 
                    weight={2}
                    opacity={0.5}
                />
              </React.Fragment>
            );
          })}
          
          <MapController focusCoord={focusCoord} />
        </MapContainer>
      </div>
    </div>
  );
};

export default AdminTracking;
