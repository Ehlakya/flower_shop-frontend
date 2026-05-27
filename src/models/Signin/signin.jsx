import React, { useState } from "react";
import "./signin.css";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid credentials");
        return;
      }

      login(data.token);
      
      // Admins and Users now both land on the Home page by default
      navigate("/");

    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
    }
  };

  return (
    <div className="container">

      {/* Left Form */}
      <div className="form-box">
        <h1>Sign In ❤️</h1>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-box">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit">Sign In</button>

          <p>
            Don't have an account?{" "}
            <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </div>

      {/* Right Image */}
      <div className="image-box">
        <img src="src/assets/signin.png" alt="cake and flowers" />
      </div>

    </div>
  );
};

export default SignIn;
