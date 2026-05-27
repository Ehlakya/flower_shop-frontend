import React from "react";
import "./ProductCard.css";
import { useNavigate } from "react-router-dom";
import { addToCart, deleteProduct } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function ProductCard({ id, image, title, price, description, category }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first to add items to cart");
      navigate("/signin");
      return;
    }
    
    try {
      await addToCart(id);
      alert(`${title} added to cart!`);
      navigate("/cart");
    } catch (error) {
      console.error("Add to cart failed:", error);
      alert("Failed to add to cart");
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/edit-item/${id}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteProduct(id);
        alert("Product deleted successfully");
        window.location.reload(); // Refresh to show changes
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete product");
      }
    }
  };

  const handleViewDetails = (e) => {
    if (e) e.stopPropagation();
    navigate(`/product/${id}`);
  };

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/260x200?text=No+Image";
    if (img.startsWith("http") || img.startsWith("/src") || img.startsWith("data:")) {
      return img;
    }
    return `http://localhost:5000/uploads/${img}`;
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${id}`)}>
      <div className="image-container">
        <img src={getImageUrl(image)} alt={title} className="product-image" />
        <button 
          className="corner-add-btn" 
          onClick={handleAddToCart} 
          title="Add to Cart"
        >
          🛒
        </button>
      </div>
      
      {user?.role === 'admin' && (
        <div className="admin-actions-overlay">
          <button className="edit-icon-btn" onClick={handleEdit} title="Edit Product">✏️</button>
          <button className="delete-icon-btn" onClick={handleDelete} title="Delete Product">🗑️</button>
        </div>
      )}

      <div className="product-info">
        <h3 className="product-title">{title}</h3>
        <p className="product-description">{description}</p>
        <span className="product-price">₹{price}</span>
        
        <div className="product-actions">
          <button className="view-btn" onClick={(e) => { e.stopPropagation(); handleViewDetails(); }}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
