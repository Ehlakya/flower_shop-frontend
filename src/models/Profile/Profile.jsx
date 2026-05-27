import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminProfile from './AdminProfile';
import CustomerProfile from './CustomerProfile';
import './Profile.css';

function Profile() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="profile-loading">Loading Profile...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return (
    <div className="profile-wrapper">
      {user.role === 'admin' ? <AdminProfile /> : <CustomerProfile />}
    </div>
  );
}

export default Profile;
