import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addToCart } from "../../services/api";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        console.error("Failed to fetch product details");
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to add items to your cart");
      navigate("/signin");
      return;
    }

    try {
      setAdding(true);
      await addToCart(id);
      alert(`${product.name} added to cart!`);
      navigate("/cart");
    } catch (error) {
      console.error("Add to cart failed:", error);
      alert("Failed to add to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/500x400?text=No+Image";
    if (img.startsWith("http") || img.startsWith("/src") || img.startsWith("data:")) {
      return img;
    }
    return `http://localhost:5000/uploads/${img}`;
  };

  if (loading) return <div className="loading-container">Loading Product Details...</div>;
  if (!product) return <div className="error-container">Product not found.</div>;

  return (
    <div className="product-details-page">
      <div className="details-container">
        <div className="details-image-section">
          <img src={getImageUrl(product.image)} alt={product.name} className="main-product-img" />
        </div>

        <div className="details-info-section">
          <span className="category-tag">{product.category}</span>
          <h1 className="details-title">{product.name}</h1>
          <p className="details-price">₹{product.price}</p>
          
          <div className="details-description">
            <h3>Description</h3>
            <p>{product.description || "No description provided for this premium item."}</p>
          </div>

          <div className="details-actions">
            <button 
              className="add-to-cart-big-btn" 
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? "Adding..." : "Add to Cart"}
            </button>
            <button className="back-btn" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
          
          <div className="trust-badges">
             <span>✓ Fresh Delivery</span>
             <span>✓ Handpicked quality</span>
             <span>✓ Secure Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
