import React, { useState, useEffect } from "react";
import "../Home/AddItem.css"; // Reuse AddItem styles
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function EditItem() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Flowers",
    description: "",
    existingImage: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();
      setFormData({
        name: data.name,
        price: data.price,
        category: data.category,
        description: data.description || "",
        existingImage: data.image
      });
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("description", formData.description);
    data.append("existingImage", formData.existingImage);
    
    if (imageFile) {
      data.append("image", imageFile);
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: data
      });

      if (response.ok) {
        alert("Product Updated Successfully! 🎉");
        navigate("/");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="error-message">Access Denied. Admins only.</div>;
  }

  if (loading) return <div className="loading">Loading details...</div>;

  return (
    <div className="add-item-page">
      <div className="form-card">
        <h2>Edit Product</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
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
            <label>Product Image (Leave empty to keep current)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {formData.existingImage && !imageFile && (
              <p className="current-img-tip">Current: {formData.existingImage}</p>
            )}
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Updating..." : "Update Product"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditItem;
