import React, { useState } from "react";

const productsData = {
  attars: [
    {
      id: 1,
      name: "Vedic Hawan Cups",
      price: 230,
      category: "Cups",
      scent: "Pure Bhakti",
      img: "/images/products/vedic.png", // ✅ string path from public folder
      badge: "BESTSELLER",
    },
    {
      id: 1,
      name: "Vedic Hawan Cups",
      price: 230,
      category: "Cups",
      scent: "Pure Bhakti",
      img: "/images/products/vedic.png", // ✅ string path from public folder
      badge: "BESTSELLER",
    },
    {
      id: 1,
      name: "Vedic Hawan Cups",
      price: 230,
      category: "Cups",
      scent: "Pure Bhakti",
      img: "/images/products/vedic.png", // ✅ string path from public folder
      badge: "BESTSELLER",
    },
    {
      id: 1,
      name: "Vedic Hawan Cups",
      price: 230,
      category: "Cups",
      scent: "Pure Bhakti",
      img: "/images/products/vedic.png", // ✅ string path from public folder
      badge: "BESTSELLER",
    },
    // ... rest of products (keep as before)
  ],
  // ... other categories
};

const Bestsellers = ({ addToCart }) => {
  const [activeTab, setActiveTab] = useState("attars");
  const [wishlist, setWishlist] = useState({});

  const toggleWishlist = (id) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = (product) => {
    const price = typeof product.price === "number" ? product.price : 250;
    addToCart(price);
  };

  // Helper to check if a string is an image path
  const isImagePath = (str) => {
    return (
      str &&
      typeof str === "string" &&
      (str.startsWith("/") ||
        str.startsWith("http") ||
        str.includes(".png") ||
        str.includes(".jpg") ||
        str.includes(".jpeg") ||
        str.includes(".webp"))
    );
  };

  const renderProducts = (products) => (
    <div className="products-grid">
      {products.map((prod) => (
        <div key={prod.id} className="product-card reveal">
          <div className="product-img">
            {isImagePath(prod.img) ? (
              <img
                src={prod.img}
                alt={prod.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  // fallback to emoji if image fails to load
                  e.target.style.display = "none";
                  e.target.parentElement.style.fontSize = "60px";
                  e.target.parentElement.style.display = "flex";
                  e.target.parentElement.style.alignItems = "center";
                  e.target.parentElement.style.justifyContent = "center";
                  e.target.parentElement.textContent = "🌸";
                }}
              />
            ) : (
              <span style={{ fontSize: "60px" }}>{prod.img || "🌸"}</span>
            )}
            {prod.badge && <span className="product-badge">{prod.badge}</span>}
            <button
              className="product-wishlist"
              onClick={() => toggleWishlist(prod.id)}
            >
              {wishlist[prod.id] ? "❤️" : "🤍"}
            </button>
          </div>
          <div className="product-info">
            <div className="product-category">{prod.category}</div>
            <div className="product-name">{prod.name}</div>
            <div className="product-scent">{prod.scent}</div>
            <div className="product-footer">
              <div>
                <span className="product-price">
                  {typeof prod.price === "number"
                    ? `₹${prod.price}`
                    : prod.price}
                </span>
                <span className="product-price-sub">
                  {prod.isSelect ? "Multiple sizes available" : "Alcohol-free"}
                </span>
              </div>
              <button
                className="add-cart-btn"
                onClick={() => handleAddToCart(prod)}
              >
                {prod.isSelect ? "SELECT" : "ADD"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      id="bestsellers"
      style={{ background: "var(--cream)", padding: "80px 0" }}
    >
      <div className="section">
        <div className="section-header">
          <span className="section-eyebrow">Most Loved</span>
          <h2 className="section-title">
            Our Best <em>Sellers</em>
          </h2>
          <div className="section-divider"></div>
        </div>
        <div className="tab-bar">
          {["attars", "perfumes", "poojan", "care"].map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {activeTab === "attars" && renderProducts(productsData.attars)}
          {activeTab === "perfumes" && renderProducts(productsData.perfumes)}
          {activeTab === "poojan" && renderProducts(productsData.poojan)}
          {activeTab === "care" && renderProducts(productsData.care)}
        </div>
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <a href="#" className="btn-primary">
            VIEW ALL PRODUCTS
          </a>
        </div>
      </div>
    </div>
  );
};

export default Bestsellers;
