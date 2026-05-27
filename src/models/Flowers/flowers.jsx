import React, { useState, useEffect } from "react";
import "./flowers.css";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getProducts } from "../../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts("Flowers");
        setProducts(data);
      } catch (error) {
        console.error("Error fetching flowers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="products-section">
      <h2 className="flowers-title"> Flowers </h2>
      
      {loading ? (
        <p style={{ textAlign: "center", marginTop: "20px" }}>Loading flowers...</p>
      ) : products.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "20px" }}>No flowers found.</p>
      ) : (
        <div className="products-container">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}   
              image={product.image}
              title={product.name}
              description={product.description}
              price={product.price}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Products;
