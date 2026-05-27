import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../Profile/Profile.css"; // Reuse existing profile styles
import { FaArrowLeft, FaClipboardList, FaPlayCircle, FaSatellite } from "react-icons/fa";
import socket from "../../services/socket";

const SHOP_LOCATION = { lat: 10.9984, lng: 77.0308 };

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders/admin/all", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          console.warn("Admin Orders: Received non-array data", data);
          setOrders([]);
        }
      } else {
        console.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        );
      } else {
        const err = await response.json();
        alert(`Failed to update: ${err.message || err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('Connection error while updating status.');
    }
  };

  const triggerSimulation = (order) => {
    if (!order.coords || !order.coords.lat) {
        alert("This order has no delivery coordinates.");
        return;
    }

    if (!socket.connected) socket.connect();
    
    socket.emit('startSimulation', {
        orderId: order.id,
        userId: order.userId,
        start: SHOP_LOCATION,
        end: order.coords
    });

    alert(`🚀 Simulation started for Order #${order.id}! Open the tracking page to view.`);
  };


  if (loading) {
    return <div className="profile-loading">Loading All Orders...</div>;
  }

  return (
    <div className="profile-wrapper">
      <div className="admin-profile-container" style={{flexDirection: 'column'}}>
        <header className="admin-header" style={{marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <h1 style={{margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
              <FaClipboardList style={{color: '#6e45e2'}} /> Admin Orders Management
            </h1>
          </div>
          <div className="badge" style={{padding: '0.5rem 1rem', fontSize: '1rem'}}>
            Total Orders: {orders.length}
          </div>
        </header>

        <div className="orders-view styled-card">
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Order Info</th>
                  <th>Customer</th>
                  <th>Delivery Details</th>
                  <th>Price Details</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr>
                      <td>
                      <div className="order-main-info">
                        <p><strong>Order #{order.id}</strong></p>
                        <p className="text-muted" style={{fontSize: '0.8rem'}}>
                          {new Date(order.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="badge" style={{marginTop: '0.3rem', fontSize: '0.7rem'}}>
                          {order.payment_method}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="customer-info-cell">
                        <p><strong>{order.customer.name}</strong></p>
                        <p className="text-muted" style={{fontSize: '0.8rem'}}>{order.customer.phone}</p>
                        <p className="text-muted" style={{fontSize: '0.7rem'}}>Acct: {order.customer.account_name}</p>
                      </div>
                    </td>
                    <td>
                      <div style={{fontSize: '0.85rem', maxWidth: '220px', lineHeight: '1.4'}}>
                        <p>{order.customer.address}</p>
                        <p>{order.customer.city}, {order.customer.pincode}</p>
                      </div>
                    </td>
                    <td>
                      <div className="price-info">
                        <p style={{fontSize: '1.1rem', fontWeight: '700', color: '#333'}}>₹{order.total}</p>
                        <p className="text-muted" style={{fontSize: '0.75rem'}}>Incl. Taxes</p>
                      </div>
                    </td>
                    <td>
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          background: '#fff',
                          fontWeight: '600',
                          color:
                            order.status === 'delivered' ? '#2e7d32' :
                            order.status === 'shipping' ? '#1565c0' :
                            order.status === 'confirmed' ? '#6a1b9a' : '#e65100'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipping">Shipping</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="view-details-btn" 
                        onClick={() => toggleOrderDetails(order.id)}
                      >
                        {expandedOrderId === order.id ? 'Hide Info' : 'Order Info'}
                      </button>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr className="expanded-row">
                      <td colSpan="6">
                        <div className="order-expanded-details">
                          <h4>Order Items</h4>
                            <div className="item-details-grid">
                              <div className="grid-header">
                                <span>Image</span>
                                <span>Product</span>
                                <span>Quantity</span>
                                <span>Price</span>
                                <span>Total</span>
                              </div>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="grid-row">
                                  <div className="item-thumb-mini">
                                    <img 
                                      src={item.product_image.startsWith('http') ? item.product_image : `http://localhost:5000/uploads/${item.product_image}`} 
                                      alt={item.product_name} 
                                    />
                                  </div>
                                  <span>{item.product_name}</span>
                                  <span>{item.quantity}</span>
                                  <span>₹{item.item_price}</span>
                                  <span>₹{item.item_price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div className="order-total-footer">
                              <span>Total Amount:</span>
                              <strong>₹{order.items.reduce((sum, item) => sum + (item.quantity * item.item_price), 0)}</strong>
                            </div>
                            
                            <div className="simulation-control" style={{marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                                <div style={{display: 'flex', gap: '15px'}}>
                                    <button 
                                        className="sim-btn" 
                                        onClick={() => triggerSimulation(order)}
                                        style={{
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <FaPlayCircle /> Simulation
                                    </button>
                                    <button 
                                        className="sim-btn" 
                                        onClick={() => navigate(`/admin/live-track/${order.id}`)}
                                        style={{
                                            background: '#6e45e2',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <FaSatellite /> Monitor Live
                                    </button>
                                </div>
                                <p style={{fontSize: '0.8rem', color: '#666', marginTop: '8px'}}>* Admin can broadcast GPS or simulate movement to the customer.</p>
                            </div>
                          </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '4rem'}}>
                      <FaClipboardList style={{fontSize: '3rem', color: '#ddd', marginBottom: '1rem'}} />
                      <p>No orders have been placed yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;
