import React from 'react';
import { Link } from 'react-router-dom';
import './checkout.css'; // Reuse checkout styles for consistency

const OrderSuccess = () => {
  return (
    <div className="checkout-page" style={{ textAlign: 'center', padding: '100px 20px' }}>
      <div className="success-container" style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</h1>
        <h2 style={{ color: '#2ecc71', fontSize: '32px', marginBottom: '10px' }}>Order Placed Successfully!</h2>
        <p style={{ color: '#7f8c8d', fontSize: '18px', marginBottom: '30px' }}>
          Thank you for shopping with us! Your order has been received and is being processed. 
          You will receive a confirmation shortly.
        </p>
        <div className="actions">
          <Link to="/orders" className="order-btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 30px', background: '#ff4d6d', color: 'white', borderRadius: '8px', marginBottom: '10px' }}>
            View My Orders
          </Link>
          <div style={{ marginTop: '10px' }}>
            <Link to="/" style={{ color: '#7f8c8d', textDecoration: 'none' }}>Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
