import "./Cart.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/cart", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Failed to fetch cart");
      
      const data = await response.json();
      setCartItems(data);
      // Sync with localStorage as requested
      localStorage.setItem("cart", JSON.stringify(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/cart/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setCartItems(cartItems.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  };

  const decreaseQty = async (itemId, currentQty, productId) => {
    const token = localStorage.getItem("token");
    try {
      if (currentQty > 1) {
        // Decrement on backend
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ product_id: productId, quantity: -1 })
        });
        if (response.ok) fetchCart();
      } else {
        // If it's the last item, remove it entirely
        removeItem(itemId);
      }
    } catch (err) {
      console.error("Failed to decrease quantity", err);
    }
  };

  const increaseQty = async (productId) => {
    // Re-use our secure POST API logically to bump quantities seamlessly
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      if(response.ok) {
        fetchCart(); // Re-sync seamlessly
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Build Image URLs similarly to standard product pipeline mapping
  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/150";
    if (img.startsWith("http") || img.startsWith("/src") || img.startsWith("data:")) return img;
    return `http://localhost:5000/uploads/${img}`;
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  if (loading) return <div style={{textAlign: "center", padding: "50px"}}>Loading secure cart...</div>;

  return (
    <div className="cart">
      <h2>Your Secure Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <p className="no-items" style={{textAlign: "center", padding: "30px"}}>Your Cart is Empty.</p>
      ) : (
        <div className="cart-container">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={getImageUrl(item.image)} alt={item.name} />

              <div className="cart-details">
                <h3>{item.name}</h3>
                <p>₹{item.price}</p>

                <div className="cart-actions">
                  <div className="quantity-controls">
                    <button onClick={() => decreaseQty(item.id, item.quantity, item.product_id)}>−</button>
                    <span className="qty-display">{item.quantity}</span>
                    <button onClick={() => increaseQty(item.product_id)}>+</button>
                  </div>

                  <button className="remove-btn" onClick={() => removeItem(item.id)}>🗑 Remove</button>
                </div>
              </div>
            </div>
          ))}

          <h3 className="cart-total">Total: ₹ {total}</h3>

          <button className="checkout-btn" onClick={() => navigate("/checkout")}>Secure Checkout</button>
        </div>
      )}
    </div>
  );
}

export default Cart;
