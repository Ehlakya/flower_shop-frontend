import React from "react";
import "./home.css";
import { useNavigate } from "react-router-dom";
import Occasions from "./Occasions";
import LatestArrivals from "./LatestArrivals";

const categories = [
  { name: "Flowers", img: "/images/flower1.jpg", path: "/flowers" },
  { name: "Cakes", img: "/images/cake1.jpg", path: "/cakes" },
  { name: "Plants", img: "/images/plant1.jpg", path: "/plants" },
  { name: "Gifts", img: "/images/gift.jpg", path: "/gifts" },
];

function Home() {
  const navigate = useNavigate();
  
  return (
    <div>

      {/* Banner */}
      <div className="banner">
        <div>
          <img className="banner-img" src="src\assets\banner img 1.avif" alt=" banner" />
        </div>
      </div>

      {/* Categories */}
      <div className="categories">
        {categories.map((item, index) => (
          <div
            className="card"
            key={index}
            onClick={() => navigate(item.path)}  // 👈 navigation
          >
            <img src={item.img} alt={item.name} />
            <p>{item.name}</p>
          </div>
        ))}
      </div>
      
      {/* Dynamic Latest Arrivals Feed */}
      <LatestArrivals />

      <>
        <Occasions />
      </>
    </div>
  );
}

export default Home;
