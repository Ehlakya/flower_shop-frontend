import React, { useState, useEffect } from "react";
import "./AddItem.css"; // Reuse AddItem styling for consistency
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function EditItem() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Flowers",
    description: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name,
          price: data.price,
          category: data.category,
          description: data.description || ""
        });
        setExistingImage(data.image);
      } else {
        alert("Product not found");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
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
    setUpdating(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("description", formData.description);
    
    if (imageFile) {
      data.append("image", imageFile);
    } else {
      data.append("existingImage", existingImage);
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
        alert("Product Updated Successfully! ✨");
        navigate("/admin/dashboard");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || errorData.error}`);
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="error-message">Access Denied. Admins only.</div>;
  }

  if (loading) {
    return <div className="loading-state">Loading Product Data...</div>;
  }

  return (
    <div className="add-item-page">
      <div className="form-card">
        <h2>Edit Product Details</h2>
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
            <label>Update Image (Optional)</label>
            <div style={{marginBottom: '10px'}}>
               <p style={{fontSize: '0.8rem', color: '#666'}}>Current Image:</p>
               <img 
                 src={existingImage.startsWith('http') ? existingImage : `http://localhost:5000/uploads/${existingImage}`} 
                 alt="Current" 
                 style={{width: '60px', height: '60px', borderRadius: '5px', objectFit: 'cover'}}
               />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
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

          <div className="button-group" style={{display: 'flex', gap: '10px'}}>
            <button type="submit" className="submit-btn" disabled={updating}>
                {updating ? "Updating..." : "Save Changes"}
            </button>
            <button type="button" className="cancel-btn" onClick={() => navigate("/admin/dashboard")} style={{background: '#666', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
                Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditItem;
