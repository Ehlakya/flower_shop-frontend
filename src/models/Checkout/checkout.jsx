import React, { useState, useEffect, useCallback } from "react";
import "./checkout.css";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [11.0168, 76.9558];

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });

    return position === null ? null : (
        <Marker position={[position.lat, position.lng]} draggable={true} eventHandlers={{
            dragend: (e) => {
                const latlng = e.target.getLatLng();
                setPosition({ lat: latlng.lat, lng: latlng.lng });
            }
        }} />
    );
}

function MapAutoCenter({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], 16);
        }
    }, [position, map]);
    return null;
}

const Checkout = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
    const [locationCoords, setLocationCoords] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchCart = async () => {
            const token = localStorage.getItem("token");
            if (!token) { navigate("/signin"); return; }
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    const cart = await response.json();
                    setCartItems(cart);
                    const sum = cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
                    setCartTotal(sum);
                }
            } catch (err) { console.error(err); }
        };
        fetchCart();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone") {
            // Only allow digits and max 10 characters
            const digits = value.replace(/\D/g, "");
            if (digits.length <= 10) {
                setFormData({ ...formData, [name]: digits });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocationCoords(newCoords);
                reverseGeocode(newCoords.lat, newCoords.lng);
            },
            (err) => { alert("Location detection failed"); }
        );
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setFormData(prev => ({ ...prev, address: data.display_name }));
            }
        } catch (err) { console.error(err); }
    };

    const handlePlaceOrder = async () => {
        if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.pincode.trim()) {
            alert("Please fill in all details."); return;
        }
        if (formData.phone.length !== 10) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }
        if (!paymentMethod) { alert("Select payment method."); return; }
        setIsProcessing(true);
        try {
            const orderPayload = {
                customerDetails: formData,
                cartItems: cartItems.map(item => ({ product_id: item.product_id, quantity: item.quantity, price: item.price })),
                total: cartTotal,
                paymentMethod: paymentMethod,
                latitude: locationCoords?.lat || 11.0168,
                longitude: locationCoords?.lng || 76.9558
            };
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify(orderPayload)
            });
            if (response.ok) {
                const result = await response.json();
                navigate("/order-success", { state: { orderId: result.orderId } });
            }
        } catch (err) { console.error(err); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="checkout-wrapper">
            <h1 className="main-heading">Secure Checkout</h1>
            <div className="checkout-container">
                <div className="customer-details-section">
                    <h2>Shipping Details</h2>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div className="form-group-row" style={{display: "flex", gap: "15px"}}>
                        <div style={{flex: 1}}>
                            <label>City</label>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} required />
                        </div>
                        <div style={{flex: 1}}>
                            <label>Pincode</label>
                            <div style={{display: "flex", gap: "10px"}}>
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required style={{flex: 1}} />
                                <button type="button" onClick={detectLocation} className="detect-btn">Detect</button>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Delivery Address</label>
                        <textarea name="address" rows="2" value={formData.address} onChange={handleChange} required></textarea>
                    </div>
                    <div className="map-picker-section">
                        <label style={{fontSize: '0.9rem', fontWeight: 'bold', color: '#c2185b'}}>Pin Precise Location</label>
                        <div style={{height: '250px', width: '100%', marginTop: '10px', borderRadius: '12px', overflow: 'hidden'}}>
                            <MapContainer center={locationCoords ? [locationCoords.lat, locationCoords.lng] : DEFAULT_CENTER} zoom={13} style={{height: '100%', width: '100%'}}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                <LocationMarker position={locationCoords} setPosition={setLocationCoords} />
                                <MapAutoCenter position={locationCoords} />
                            </MapContainer>
                        </div>
                    </div>
                </div>
                <div className="order-summary-section">
                    <h2>Order Summary</h2>
                    <div className="summary-row total-row"><span>Total:</span><span>₹{cartTotal}</span></div>
                    <div className="payment-options">
                        <label className="payment-radio">
                            <input type="radio" name="payment" value="COD" onChange={(e) => setPaymentMethod(e.target.value)} /> 
                            COD (Cash on Delivery)
                        </label>
                        <label className="payment-radio">
                            <input type="radio" name="payment" value="ONLINE" onChange={(e) => setPaymentMethod(e.target.value)} /> 
                            Online Payment (UPI/QR)
                        </label>
                    </div>

                    {paymentMethod === "ONLINE" && (
                        <div className="qr-container">
                            <span className="qr-hint">Scan to Pay securely</span>
                            <img 
                                src="/images/payment_qr.png" 
                                alt="Payment QR Code" 
                                className="styled-qr" 
                                style={{ width: '200px', height: '200px' }} 
                            />
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                Scan this QR with any UPI app (GPay, PhonePe, etc.)
                            </p>
                        </div>
                    )}
                    <button className="place-order-button" onClick={handlePlaceOrder} disabled={isProcessing}>{isProcessing ? "Processing..." : "Place Order"}</button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
