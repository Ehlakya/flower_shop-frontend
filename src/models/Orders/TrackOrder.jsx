import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import './TrackOrder.css';

// Custom icons
const bikeIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3144/3144510.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45]
});

const customerIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1275/1275214.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35]
});

const shopIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/606/606395.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35]
});

const SHOP_LOCATION = { lat: 19.1176, lng: 72.8715 }; // Default Shop Location

const MapAutoCenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo(position, { animate: true });
    }
  }, [position, map]);
  return null;
};

const TrackOrder = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [riderLocation, setRiderLocation] = useState(SHOP_LOCATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/my-orders`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const allOrders = await response.json();
        const currentOrder = allOrders.find(o => o.id === parseInt(orderId));
        
        if (currentOrder) {
          setOrder(currentOrder);
          // If order is delivered, move rider to customer
          if (currentOrder.status === 'delivered') {
            setRiderLocation({ lat: parseFloat(currentOrder.latitude), lng: parseFloat(currentOrder.longitude) });
          }
        }
      } catch (err) {
        console.error('Fetch Order Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Socket.io for live updates
    if (user) {
      if (!socket.connected) socket.connect();
      socket.emit('joinRoom', `user_${user.id}`); // Users listen to their own updates

      socket.on('deliveryLocationUpdate', (data) => {
        console.log('📡 Live Location Update:', data);
        if (data.orderId === parseInt(orderId)) {
          setRiderLocation({ lat: data.lat, lng: data.lng });
        }
      });

      socket.on('orderStatusUpdate', (data) => {
        if (data.orderId === parseInt(orderId)) {
          setOrder(prev => ({ ...prev, status: data.status }));
        }
      });

      return () => {
        socket.off('deliveryLocationUpdate');
        socket.off('orderStatusUpdate');
      };
    }
  }, [orderId, user]);

  if (loading) return <div className="track-loading">Locating your delivery...</div>;
  if (!order) return <div className="track-error">Order not found.</div>;

  const customerPos = [parseFloat(order.latitude), parseFloat(order.longitude)];
  const riderPos = [riderLocation.lat, riderLocation.lng];
  const shopPos = [SHOP_LOCATION.lat, SHOP_LOCATION.lng];

  return (
    <div className="track-order-page">
      <div className="track-header">
        <button onClick={() => navigate('/orders')} className="back-btn">← Back to Orders</button>
        <div className="order-info-mini">
          <h2>Order #{order.id}</h2>
          <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
        </div>
      </div>

      <div className="track-main-container">
        <div className="map-sidebar">
          <div className="info-card">
            <h3>Delivery Progress</h3>
            <p className="time-est">Estimated Time: 15-20 mins</p>
            <div className="progress-timeline">
              <div className={`step ${['pending', 'confirmed', 'preparing', 'shipping', 'delivered'].indexOf(order.status) >= 1 ? 'active' : ''}`}>Confirmed</div>
              <div className={`step ${['preparing', 'shipping', 'delivered'].indexOf(order.status) >= 2 ? 'active' : ''}`}>Preparing</div>
              <div className={`step ${['shipping', 'delivered'].indexOf(order.status) >= 3 ? 'active' : ''}`}>On the Way</div>
              <div className={`step ${order.status === 'delivered' ? 'active' : ''}`}>Delivered</div>
            </div>
          </div>
          <div className="rider-card">
              <img src="https://cdn-icons-png.flaticon.com/512/3144/3144510.png" alt="Rider" />
              <div>
                  <h4>Rahul (Delivery Partner)</h4>
                  <p>⭐ 4.8 | On a bicycle</p>
              </div>
          </div>
          <div className="address-snapshot">
              <h4>Delivery To:</h4>
              <p>{order.address_snapshot}</p>
              <p>Pincode: {order.pincode_snapshot}</p>
          </div>
        </div>

        <div className="track-map-wrapper">
          <MapContainer center={riderPos} zoom={14} style={{ height: '640px', width: '100%', borderRadius: '15px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* Shop Marker */}
            <Marker position={shopPos} icon={shopIcon}>
              <Popup>FloraSurprise Shop</Popup>
            </Marker>

            {/* Customer Marker */}
            <Marker position={customerPos} icon={customerIcon}>
              <Popup>Delivery Destination</Popup>
            </Marker>

            {/* Live Rider Marker */}
            <Marker position={riderPos} icon={bikeIcon}>
              <Popup>Delivery Partner (Live)</Popup>
            </Marker>

            {/* Route Line */}
            <Polyline positions={[shopPos, riderPos, customerPos]} color="#ff4081" dashArray="10, 10" weight={3} />
            
            <MapAutoCenter position={riderPos} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
