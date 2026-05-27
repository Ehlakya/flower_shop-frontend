import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaHistory, FaMapMarkerAlt, FaSignOutAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

function CustomerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('My Profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchProfile(), fetchOrders()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/users/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      console.log("Profile API Status:", res.status);
      
      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/signin");
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Profile Data:", data);
      setProfile(data);
    } catch (e) {
      console.error("Profile Fetch Error:", e);
      setError(e.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/orders/my-orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error("Orders Fetch Error:", e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  if (loading) return <div className="loading" style={{textAlign:"center", padding:"50px"}}>Loading profile details...</div>;
  if (error) return <div className="error" style={{textAlign:"center", padding:"50px", color:"red"}}>Error: {error}</div>;
  if (!profile) return <div className="error" style={{textAlign:"center", padding:"50px"}}>Profile data could not be loaded.</div>;

  return (
    <div className="customer-profile-container admin-profile-container">
      <aside className="profile-sidebar">
        <div className="sidebar-header">
          <div className="admin-avatar customer-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <h3>{user.name}</h3>
          <span className="role-badge customer">Customer</span>
        </div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'My Profile' ? 'active' : ''} onClick={() => setActiveTab('My Profile')}><FaUser /> Personal Info</button>
          <button className={activeTab === 'Orders' ? 'active' : ''} onClick={() => setActiveTab('Orders')}><FaHistory /> Order History</button>
          <button onClick={handleLogout} className="logout-btn"><FaSignOutAlt /> Logout</button>
        </nav>
      </aside>

      <main className="profile-content">
        {activeTab === 'My Profile' && (
          <div className="my-profile-view styled-card">
            <h2>Personal Information</h2>
            <div className="profile-info-grid">
               <div className="info-group">
                   <label><FaUser/> Full Name</label>
                   <input type="text" value={profile.name} disabled />
               </div>
               <div className="info-group">
                   <label><FaEnvelope/> Username / Email</label>
                   <input type="text" value={profile.email} disabled />
               </div>
            </div>
            <p className="note text-muted" style={{marginTop:"20px", fontSize:"0.9rem"}}>Standard customer profile. Contact support to update your credentials.</p>
          </div>
        )}

        {activeTab === 'Orders' && (
          <div className="orders-view styled-card">
            <h2>My Order History</h2>
            {orders.length === 0 ? (
              <p className="no-orders">You haven't placed any orders yet.</p>
            ) : (
              <div className="order-history-list">
                {orders.map(order => (
                  <div key={order.id} className="order-history-card">
                    <div className="order-history-header">
                      <span><strong>Order ID:</strong> #{order.id}</span>
                      <span><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</span>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                    </div>
                    <div className="order-history-body">
                       <p><strong>Total:</strong> ₹{order.total}</p>
                       <div className="order-preview-items">
                         {order.items.slice(0, 3).map((item, idx) => (
                           <span key={idx} className="preview-chip">{item.product_name} (x{item.quantity})</span>
                         ))}
                         {order.items.length > 3 && <span className="preview-chip">+{order.items.length - 3} more</span>}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerProfile;
