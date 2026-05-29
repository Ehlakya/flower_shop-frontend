import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.log("🛡️ AdminDashboard Loaded");
    console.log("👤 Current User Data:", user);
    console.log("🔑 Current Role from Context:", user?.role);
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (response.ok) {
          alert("Product deleted successfully");
          setProducts(products.filter(p => p.id !== id));
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

  if (!user || user.role !== 'admin') {
    return <div className="admin-error">Access Denied. Admins only.</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Inventory Management</h1>
        <button className="add-new-btn" onClick={() => navigate("/add-item")}>
          <FaPlus /> Add New Product
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
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
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={(product.image.startsWith('http') || product.image.startsWith('/images') || product.image.startsWith('/src')) ? product.image : `/uploads/${product.image}`} 
                      alt={product.name} 
                      className="admin-thumb" 
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>₹{product.price}</td>
                  <td className="actions-cell">
                    <button className="edit-btn" onClick={() => navigate(`/edit-item/${product.id}`)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(product.id, product.name)}>
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
