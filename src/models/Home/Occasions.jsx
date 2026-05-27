import React from "react";
import "./occasions.css";

const data = [
  {
    title: "Birthday Gifts",
    img: "https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e",
  },
  {
    title: "Anniversary Gifts",
    img: "https://images.unsplash.com/photo-1607083206968-13611e3d76db",
  },
  {
    title: "Gifts for Him",
    img: "/src/assets/gift.jpg",
  },
  {
    title: "Gifts for Her",
    img: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
  },
];

function Occasions() {
  return (
    <div className="occasion-section">
      <h2>Shop By Occasions & Relations</h2>
      <p className="subtitle">Surprise Your Loved Ones</p>

      <div className="occasion-container">
        {data.map((item, index) => (
          <div className="occasion-card" key={index}>
            <img src={item.img} alt={item.title} />
            <div className="card-title">{item.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Occasions;
