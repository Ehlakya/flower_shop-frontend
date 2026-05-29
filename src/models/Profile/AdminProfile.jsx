import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import "./AdminProfile.css";
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaPlus, FaBoxOpen, FaUser, FaClipboardList, FaUsers, FaSignOutAlt, FaEdit, FaTrash, FaSatellite } from 'react-icons/fa';

function AdminProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState({ totalProducts: 0, totalCustomers: 0, totalOrders: 0, totalRevenue: 0 });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Custom form states for adding items
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Flowers', description: '', image: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchProducts(), fetchCustomers(), fetchOrders()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/stats`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/customers`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/all`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (response.ok) {
          alert("Product deleted successfully");
          fetchProducts();
          fetchStats(); // Update stats
        } else {
          const errorData = await response.json();
          alert(`Failed to delete product: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Delete Error:", error);
        alert("An error occurred while deleting the product.");
      }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newItem.name);
    formData.append('price', newItem.price);
    formData.append('category', newItem.category);
    formData.append('description', newItem.description);
    if (newItem.image) formData.append('image', newItem.image);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: formData
      });
      if (response.ok) {
        alert("Product Added Successfully!");
        setNewItem({ name: '', price: '', category: 'Flowers', description: '', image: null });
        fetchProducts();
        fetchStats();
        setActiveTab('Manage Items');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-dashboard-full">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">🌸 FlowerShop</div>
          <p className="admin-badge">Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>
            <FaChartLine /> Dashboard
          </button>
          <button className={`nav-item ${activeTab === 'Manage Items' ? 'active' : ''}`} onClick={() => setActiveTab('Manage Items')}>
            <FaBoxOpen /> Inventory
          </button>
          <button className={`nav-item ${activeTab === 'Add Items' ? 'active' : ''}`} onClick={() => setActiveTab('Add Items')}>
            <FaPlus /> Add Product
          </button>
          <button className={`nav-item ${activeTab === 'Customers' ? 'active' : ''}`} onClick={() => setActiveTab('Customers')}>
            <FaUsers /> Customers
          </button>
          <button className="nav-item" onClick={() => navigate('/admin/orders')}>
            <FaClipboardList /> Orders List
          </button>
          <button className={`nav-item ${activeTab === 'My Profile' ? 'active' : ''}`} onClick={() => setActiveTab('My Profile')}>
            <FaUser /> My Profile
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      <main className="profile-content-full">
        {activeTab === 'Dashboard' && (
          <div className="dashboard-view">
            <h2>Admin Dashboard</h2>

            <div className="profile-card top-section">
              <div className="profile-details-inline">
                <div className="avatar-large">
                  {user.profile_image ? (
                    <img src={`/uploads/${user.profile_image}`} alt="Profile" className="avatar-img" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="info">
                  <h2>{user.name}</h2>
                  <p><strong>Email/Username:</strong> {user.username}</p>
                  <p><strong>Role:</strong> <span className="admin-status">Administrator</span></p>
                </div>
              </div>
            </div>

            <div className="stats-grid" style={{ marginTop: '30px' }}>
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <div className="stat-value">₹{stats.totalRevenue}</div>
              </div>
              <div className="stat-card">
                <h3>Total Orders</h3>
                <div className="stat-value">{stats.totalOrders}</div>
              </div>
              <div className="stat-card">
                <h3>Active Deliveries</h3>
                <div className="stat-value">{orders.filter(o => o.status === 'shipping').length}</div>
              </div>
            </div>

            <div className="active-tracking-section styled-card" style={{ marginTop: '40px' }}>
              <h3>🚚 Active Deliveries Tracking</h3>
              <p className="text-muted">Monitor real-time progress of orders currently in transit.</p>

              <div className="active-list" style={{ marginTop: '20px' }}>
                {orders.filter(o => o.status === 'shipping').length > 0 ? (
                  orders.filter(o => o.status === 'shipping').map(o => (
                    <div key={o.id} className="active-track-item" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      marginBottom: '10px'
                    }}>
                      <div>
                        <strong>Order #{o.id}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{o.customer?.name} - {o.customer?.city}</div>
                      </div>
                      <button
                        className="live-btn-small"
                        onClick={() => navigate(`/admin/live-track/${o.id}`)}
                        style={{
                          background: '#6e45e2',
                          color: 'white',
                          border: 'none',
                          padding: '8px 15px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        <FaSatellite /> Monitor
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No orders are currently in 'Shipping' status.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Add Items' && (
          <div className="add-items-view styled-card">
            <h2>Add New Product</h2>
            <form onSubmit={handleAddItem} className="add-item-form-internal">
              <div className="form-group-row">
                <input type="text" placeholder="Product Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />
                <input type="number" placeholder="Price (₹)" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} required />
              </div>
              <div className="form-group-row">
                <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                  <option value="Flowers">Flowers</option>
                  <option value="Cakes">Cakes</option>
                  <option value="Plants">Plants</option>
                  <option value="Gifts">Gifts</option>
                </select>
                <input type="file" accept="image/*" onChange={e => setNewItem({ ...newItem, image: e.target.files[0] })} required />
              </div>
              <textarea placeholder="Product Description" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} rows="4"></textarea>
              <button type="submit" className="save-btn"><FaPlus /> Add Product</button>
            </form>
          </div>
        )}

        {activeTab === 'Manage Items' && (
          <div className="manage-items-view styled-card">
            <div className="header-flex">
              <h2>Inventory Management</h2>
              <button className="add-new-btn-small" onClick={() => navigate('/add-item')}><FaPlus /> Add Item</button>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td><img src={(p.image.startsWith('http') || p.image.startsWith('/images') || p.image.startsWith('/src')) ? p.image : `/uploads/${p.image}`} alt={p.name} className="tb-thumb" /></td>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>₹{p.price}</td>
                      <td>
                        <button className="icon-btn edit" onClick={() => navigate(`/edit-item/${p.id}`)}><FaEdit /></button>
                        <button className="icon-btn delete" onClick={() => handleDeleteProduct(p.id, p.name)}><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Customers' && (
          <div className="customers-view styled-card">
            <h2>Customer Directory</h2>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Joined date</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone || 'N/A'}</td>
                      <td><span className="badge">{c.orders_count}</span></td>
                      <td>{new Date(c.joined_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'My Profile' && (
          <div className="my-profile-view styled-card">
            <h2>My Profile Settings</h2>
            <div className="profile-info-grid">
              <div className="info-group">
                <label>Full Name</label>
                <input type="text" value={user.name} disabled />
              </div>
              <div className="info-group">
                <label>Username / Email</label>
                <input type="text" value={user.username} disabled />
              </div>
              <div className="info-group">
                <label>Role</label>
                <input type="text" value={user.role} disabled />
              </div>
            </div>
            <p className="note text-muted">Admin profiles are strictly managed by system configuration.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminProfile;
