import React from "react";
import Navbar from "./components/Navbar/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Footer from "./components/Footer/Footer";

// Context & Protection
import { AuthProvider } from "./context/AuthContext";
import { TrackingProvider } from "./context/TrackingContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./models/Home/home";
import Flowers from "./models/Flowers/flowers";
import Cakes from "./models/Cakes/cakes";
import Plants from "./models/Plants/plants"
import Gifts from "./models/Gifts/gifts"
import Contact from "./models/Contact/contact";
import Cart from "./models/Cart/Cart";
import Checkout from "./models/Checkout/checkout";
import SignIn from "./models/Signin/signin";
import CreateAccount from "./models/CreateAccount/CreateAccount";
import AddItem from "./models/Home/AddItem";
import AdminProfile from "./models/Profile/AdminProfile";
import AdminOrders from "./models/Admin/AdminOrders";
import AdminSignin from "./models/Admin/AdminSignin";
import EditItem from "./models/Home/EditItem";
import ProductDetails from "./models/ProductDetails/ProductDetails";
import OrderTracking from "./models/Tracking/OrderTracking";
import AdminTracking from "./models/Tracking/AdminTracking";
import AgentSimulator from "./models/Admin/AgentSimulator";
import AdminLiveTracker from "./models/Admin/AdminLiveTracker";
import MyOrders from "./models/Orders/MyOrders";
import OrderSuccess from "./models/Checkout/OrderSuccess";

function App() {
  React.useEffect(() => {
    // REQUIREMENT: Every time the page is refreshed, go to the login page.
    // Allow /signin, /signup, and /admin-login to persist without redirecting.
    const publicPaths = ["/signin", "/signup", "/admin-login"];
    if (!publicPaths.includes(window.location.pathname)) {
      window.location.href = "/signin";
    }
  }, []);

  return (
    <AuthProvider>
      <TrackingProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<CreateAccount />} />
              <Route path="/admin-login" element={<AdminSignin />} />
              <Route path="/product/:id" element={<ProductDetails />} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/flowers" element={<ProtectedRoute><Flowers /></ProtectedRoute>} />
              <Route path="/cakes" element={<ProtectedRoute><Cakes /></ProtectedRoute>} />
              <Route path="/plants" element={<ProtectedRoute><Plants /></ProtectedRoute>} />
              <Route path="/gifts" element={<ProtectedRoute><Gifts /></ProtectedRoute>} />
              <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
              <Route path="/track-order/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/add-item" element={<ProtectedRoute adminOnly><AddItem /></ProtectedRoute>} />
              
              {/* Admin Dedicated Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminProfile /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/tracking" element={<ProtectedRoute adminOnly><AdminTracking /></ProtectedRoute>} />
              <Route path="/admin/simulator" element={<ProtectedRoute adminOnly><AgentSimulator /></ProtectedRoute>} />
              <Route path="/admin/live-track/:id" element={<ProtectedRoute adminOnly><AdminLiveTracker /></ProtectedRoute>} />
              <Route path="/edit-item/:id" element={<ProtectedRoute adminOnly><EditItem /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
        </Router>
      </TrackingProvider>
    </AuthProvider>
  );
}

export default App;
