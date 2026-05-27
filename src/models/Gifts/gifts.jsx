import React, { useState, useEffect } from "react";
import "./gifts.css";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getProducts } from "../../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts("Gifts");
        setProducts(data);
      } catch (error) {
        console.error("Error fetching gifts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="products-section">
      <h2 className="gifts-title"> Gifts </h2>
      
      {loading ? (
        <p style={{ textAlign: "center", marginTop: "20px" }}>Loading gifts...</p>
      ) : products.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "20px" }}>No gifts found.</p>
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
