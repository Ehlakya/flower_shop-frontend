import React, { useState } from "react";
import "./AddItem.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AddItem() {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Flowers",
    description: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please select an image file.");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("description", formData.description);
    data.append("image", imageFile);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { 
          // Note: Do NOT set Content-Type header when sending FormData
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: data
      });

      if (response.ok) {
        alert("Product Added Successfully! 🎉");
        navigate("/");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || errorData.error}`);
      }
    } catch (error) {
      console.error("Submit Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent non-admins from seeing the form (basic front-end check)
  if (!user || user.role !== 'admin') {
    return <div className="error-message">Access Denied. Admins only.</div>;
  }

  return (
    <div className="add-item-page">
      <div className="form-card">
        <h2>Add New Product</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Red Rose Bouquet"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Price (₹)</label>
            <input
              type="number"
              name="price"
              placeholder="e.g. 499"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="Flowers">Flowers</option>
              <option value="Cakes">Cakes</option>
              <option value="Plants">Plants</option>
              <option value="Gifts">Gifts</option>
            </select>
          </div>

          <div className="input-group">
            <label>Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Tell us about this item..."
              value={formData.description}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddItem;
