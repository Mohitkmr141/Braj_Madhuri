import React from "react";

const categories = [
  { icon: "🌺", name: "TULSI MALA ORIGINAL", sub: "100% ORIGINAL TULSI MALA" },
  { icon: "🧴", name: "PERFUMES", sub: "Divine sprays" },
  { icon: "🏠", name: "HOME FRAGRANCE", sub: "Aroma oils & more" },
  { icon: "✨", name: "PERSONAL CARE", sub: "Ubtan & Gulab Jal" },
  { icon: "🪔", name: "INCENSE & DHOOP", sub: "Agarbatti & Dhoop" },
  { icon: "🛕", name: "POOJAN SAMAGRI", sub: "Chandan & more" },
];

const Categories = () => {
  return (
    <div className="categories-bg">
      <div
        style={{ textAlign: "center", marginBottom: "40px" }}
        className="section"
      >
        <span className="section-eyebrow">Explore Our Range</span>
        <h2 className="section-title">
          Shop by <em>Category</em>
        </h2>
        <div className="section-divider"></div>
      </div>
      <div className="categories-grid">
        {categories.map((cat, idx) => (
          <a href="#" key={idx} className="category-card reveal">
            <span className="category-icon">{cat.icon}</span>
            <div className="category-name">{cat.name}</div>
            <div className="category-sub">{cat.sub}</div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Categories;
