import React from "react";
import "./Navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaUser, FaMapMarkerAlt, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useTracking } from "../../context/TrackingContext";
import { FaSatellite, FaSatelliteDish } from "react-icons/fa";

function Navbar() {
  const { user, logout } = useAuth();
  const { isGlobalFollowing, setIsGlobalFollowing, isBroadcasting, setIsBroadcasting, permissionError } = useTracking();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  // Detect if we are in an Admin View (Dashboard, Orders, Add Item, Edit Item)
  const isAdminView = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/add-item') || 
                      location.pathname.startsWith('/edit-item');

  // If Admin is in an Admin View, show a simplified horizontal top navbar
  if (user?.role === 'admin' && isAdminView) {
    return (
      <nav className="admin-horizontal-navbar">
        <div className="admin-nav-left">
          <Link to="/" className="admin-logo">FloraSurprise 🌿</Link>
          <div className="admin-nav-links">
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/add-item">Add Item</Link>
            <Link to="/admin/orders">Orders</Link>
            <Link to="/admin/tracking" style={{color: '#6e45e2', fontWeight: 'bold'}}>📡 Radar</Link>
          </div>
        </div>
        
        <div className="admin-nav-right">
          {/* Global Tracking Toggle */}
          <div className="global-tracking-controls">
            {permissionError && (
              <div className="tracking-error-mini" title={permissionError} style={{ color: '#ff4d4f', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ⚠️ GPS Error
              </div>
            )}
            <button 
              className={`track-toggle-btn ${isBroadcasting ? 'broadcasting' : ''}`}
              onClick={() => setIsBroadcasting(!isBroadcasting)}
              title={isBroadcasting ? "Stop Sharing Location" : "Start Sharing Location"}
            >
              <FaSatelliteDish /> {isBroadcasting ? "Broadcasting" : "Go Live"}
            </button>
            <button 
              className={`track-toggle-btn ${isGlobalFollowing ? 'following' : ''}`}
              onClick={() => setIsGlobalFollowing(!isGlobalFollowing)}
              title="Auto-Center Map on Me"
            >
              <FaMapMarkerAlt /> {isGlobalFollowing ? "Following Me" : "Follow Me"}
            </button>
          </div>

          <span className="welcome-admin">Welcome Admin, {user.name}</span>
          <button className="admin-logout-mini" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Top Header */}
      <div className="top-header">
        <div className="logo" onClick={() => navigate("/")} style={{cursor: "pointer"}}>FloraSurprise</div>

        <div className="icons navbar-items-container">
          {user && (
            <div className="nav-group-left">
              {/* Requirement: Hide Track Order for Admin completely */}
              {user.role !== 'admin' && (
                <Link className="header nav-item" to="/track-order/live">
                  <span>Track Order 📡</span>
                </Link>
              )}
              
              {/* Role-based Dynamic Link: Admin sees 'Admin', User sees 'Cart' */}
              {user.role === 'admin' ? (
                <Link className="header nav-item" to="/admin/dashboard" style={{ color: "#e91e63", fontWeight: "bold" }}>
                  <span>Admin 🛠️</span>
                </Link> 
              ) : (
                <Link className="header nav-item" to="/cart"><span>Cart 🛒</span></Link>
              )}
            </div>
          )} 

          <div className="nav-group-right">
            {user ? (
              <div className="user-controls">
                <span className="user-greeting">
                  Welcome, {user.username || user.name}!
                </span>
                <span className="logout-trigger" onClick={handleLogout}>Logout</span>
              </div>
            ) : (
              <Link className="header nav-item" to="/signin"><span>Sign In</span></Link>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      {user && (
        <div>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/flowers">Flowers</Link></li>
            <li><Link to="/plants">Plants</Link></li>
            <li><Link to="/cakes">Cakes</Link></li>
            <li><Link to="/gifts">Gifts</Link></li>
            
            {/* Admin specific links are now consolidated into the 'Admin' header button for a cleaner Home/User experience as requested */}
          </ul>
        </div>
      )}
    </>
  );
}

export default Navbar;
