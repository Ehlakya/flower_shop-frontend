const BASE_URL = `${import.meta.env.VITE_API_URL}/api/products`;
const CART_URL = `${import.meta.env.VITE_API_URL}/api/cart`;

export const getProducts = async (category = "") => {
  const url = category ? `${BASE_URL}?category=${encodeURIComponent(category)}` : BASE_URL;
  const res = await fetch(url);
  return res.json();
};

export const createProduct = async (data) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteProduct = async (id) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete product");
  }
};

export const updateProduct = async (id, data) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { 
      "Authorization": `Bearer ${token}`
      // Note: No Content-Type for FormData
    },
    body: data, // Expecting FormData
  });
  return res.json();
};

export const addToCart = async (productId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const res = await fetch(CART_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: productId, quantity: 1 }),
  });
  
  if (!res.ok) throw new Error("Failed to add to cart");
  return res.json();
};
