import React, { useState, useEffect } from "react";
import ProductCard from "../../components/ProductCard/ProductCard";

function LatestArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestProducts();
  }, []);

  const fetchLatestProducts = async () => {
    try {
      // Securely fetch our pre-balanced advanced SQL route (2 from each category)
      const response = await fetch("/api/products/latest-products");
      
      if (!response.ok) throw new Error("Failed to fetch latest products");
      
      const data = await response.json();
      
      // The backend now securely maps exactly 8 items uniformly distributed across logic categories natively
      setProducts(data);
    } catch (error) {
      console.error("Error fetching latest arrivals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>Loading Latest Arrivals...</div>;

  return (
    <div>
      <h2 style={{ textAlign: "center", marginBottom: "30px", fontSize: "32px", color: "#e91e63" }}>
        Latest Arrivals ✨
      </h2>
      
      <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "25px",
          maxWidth: "1200px",
          margin: "0 auto"
      }}>
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            id={product.id}
            image={product.image}
            title={product.name}
            price={product.price}
            description={product.description}
            category={product.category}
          />
        ))}
      </div>
      
      {products.length === 0 && (
        <p style={{ textAlign: "center", color: "#666" }}>No products available yet!</p>
      )}
    </div>
  );
}

export default LatestArrivals;
