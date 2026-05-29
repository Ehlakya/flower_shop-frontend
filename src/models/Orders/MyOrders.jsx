import React, { useEffect, useState } from 'react';
import './MyOrders.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import socket from '../../services/socket';

const StatusTimeline = ({ currentStatus }) => {
  const statuses = ['pending', 'confirmed', 'shipping', 'delivered'];
  const currentIndex = statuses.indexOf(currentStatus?.toLowerCase());

  return (
    <div className="status-timeline">
      {statuses.map((status, index) => (
        <div key={status} className={`timeline-step ${index <= currentIndex ? 'completed' : ''} ${index === currentIndex ? 'current' : ''}`}>
          <div className="step-icon">
            {index < currentIndex ? '✓' : index + 1}
          </div>
          <span className="step-label">{status}</span>
          {index < statuses.length - 1 && <div className="step-line"></div>}
        </div>
      ))}
    </div>
  );
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Socket connection for real-time updates
    if (user && user.id) {
      socket.connect();
      socket.emit('joinRoom', user.id);

      socket.on('orderStatusUpdate', (data) => {
        console.log('📬 Received status update via socket:', data);
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === data.orderId ? { ...order, status: data.status } : order
          )
        );
      });

      return () => {
        socket.off('orderStatusUpdate');
        socket.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      if (user && user.role === 'admin') {
        navigate('/admin/orders');
        return;
      }

      try {
        const response = await fetch('/api/orders/my-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        setError('Connection error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  if (loading) return (
    <div className="orders-loading">
      <div className="spinner"></div>
      <p>Fetching your floral history...</p>
    </div>
  );

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>View and track your flower & cake purchases</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="orders-container">
        {orders.length === 0 ? (
          <div className="no-orders">
            <h3>You haven't placed any orders yet!</h3>
            <button onClick={() => navigate('/flowers')} className="shop-btn">Go Shopping</button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-main-info">
                <div className="info-group">
                  <span className="label">Order ID</span>
                  <span className="value">#{order.id}</span>
                </div>
                <div className="info-group">
                  <span className="label">Date</span>
                  <span className="value">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="info-group">
                  <span className="label">Total</span>
                  <span className="value">₹{order.total}</span>
                </div>
              </div>

              <div className="order-tracking-section">
                <h4>Track Status</h4>
                <StatusTimeline currentStatus={order.status} />
              </div>

              <div className="order-items-list">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <img 
                      src={item.product_image.startsWith('http') ? item.product_image : `/uploads/${item.product_image}`} 
                      alt={item.product_name} 
                      className="item-thumb" 
                    />
                    <div className="item-details">
                      <h4>{item.product_name}</h4>
                      <p>Qty: {item.quantity} | Price: ₹{item.item_price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrders;
