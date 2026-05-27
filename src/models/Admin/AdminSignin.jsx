import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaLock, FaUserShield } from "react-icons/fa";
import "./AdminSignin.css";

const AdminSignin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Invalid Admin Credentials");
                return;
            }

            // Verify if it's actually an admin directly on login (security measure)
            if (data.role !== 'admin') {
                alert("Access Denied: This portal is for Administrators only.");
                return;
            }

            login(data.token);
            // Redirect to Admin Dashboard
            navigate("/admin/dashboard");

        } catch (err) {
            console.error(err);
            alert("Connection error. Is the backend running?");
        }
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-card">
                <div className="admin-icon-header">
                    <FaUserShield className="shield-icon" />
                    <h1>Admin Portal</h1>
                    <p>Secure Management Access</p>
                </div>

                <form onSubmit={handleLogin} className="admin-login-form">
                    <div className="input-group">
                        <label>Admin Username</label>
                        <div className="input-wrapper">
                            <input 
                                type="text" 
                                placeholder="e.g. admin@gmail.com" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Security Key</label>
                        <div className="input-wrapper">
                            <FaLock className="field-icon" />
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="admin-submit-btn">
                        Authenticate & Enter
                    </button>
                </form>

                <div className="admin-footer">
                    <p>© 2026 FloraSurprise Admin Security System</p>
                </div>
            </div>
        </div>
    );
};

export default AdminSignin;
