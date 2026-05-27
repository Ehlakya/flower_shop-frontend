import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  // If we are still loading and don't have a user yet, wait.
  // But because of sync initialization in AuthContext, 'user' 
  // should be available immediately on refresh if a token exists.
  if (loading && !user) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner">Loading Session...</div>
      </div>
    );
  }

  // Final check of localStorage if state is somehow in a transition
  const storedRole = localStorage.getItem('userRole');
  const effectiveUser = user || (storedRole ? { role: storedRole } : null);

  if (!effectiveUser) {
    return <Navigate to="/signin" replace />;
  }

  const userRole = (effectiveUser.role || '').toLowerCase();

  if (adminOnly && userRole !== 'admin') {
    console.warn("Access Denied: Admin role required. Current role:", userRole);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
