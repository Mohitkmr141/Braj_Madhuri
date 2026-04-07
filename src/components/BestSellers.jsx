import React, { useState } from "react";

const productsData = {
  attars: [
    {
      id: 1,
      name: "Shyam Ras Attar",
      price: 230,
      category: "Attar · 12 ml",
      scent: "The Fragrance of Pure Bhakti",
      img: "🌸",
      badge: "BESTSELLER",
    },
    {
      id: 2,
      name: "Phool Bangla Attar",
      price: 230,
      category: "Attar · 8 ml",
      scent: "Essence of Shri Bankey Bihari Mandir",
      img: "🌼",
    },
    {
      id: 3,
      name: "Panchamrit Attar",
      price: 230,
      category: "Attar · 8 ml",
      scent: "Fragrance Loved by Krishna Ji",
      img: "🍯",
      badge: "DIVINE",
    },
    {
      id: 4,
      name: "Nidhivan Attar",
      price: "150 – ₹450",
      category: "Attar · 8 ml",
      scent: "Forest Earthy Divine Aroma",
      img: "🌿",
      isSelect: true,
    },
  ],
  perfumes: [
    {
      id: 5,
      name: "Hit Harivansh Perfume",
      price: 250,
      category: "Perfume · 50 ml",
      scent: "Floral Musk Amber Scent",
      img: "🫧",
      badge: "BESTSELLER",
    },
    {
      id: 6,
      name: "Phool Bangla Perfume",
      price: 300,
      category: "Perfume · 50 ml",
      scent: "Fragrance of Shri Bankey Bihari Mandir",
      img: "🌹",
    },
    {
      id: 7,
      name: "Brij Mandal Perfume",
      price: 250,
      category: "Perfume · 50 ml",
      scent: "Sweet Amber Musky Scent",
      img: "🌙",
    },
    {
      id: 8,
      name: "Panchamrit Perfume",
      price: 300,
      category: "Perfume · 50 ml",
      scent: "Fragrance Loved by Krishna Ji",
      img: "🪷",
    },
  ],
  poojan: [
    {
      id: 9,
      name: "Kesariya Chandan Tika",
      price: 250,
      category: "Chandan Tika · 30 gm",
      scent: "Kesar Yukt Liquid Tilak",
      img: "🟡",
      badge: "PREMIUM",
    },
    {
      id: 10,
      name: "Laal Chandan Tika",
      price: 250,
      category: "Chandan Tika · 30 gm",
      scent: "Kesar Yukt Liquid for Tilak",
      img: "🔴",
    },
    {
      id: 11,
      name: "Gopi Chandan Tika",
      price: 250,
      category: "Chandan Tika · 30 gm",
      scent: "Kesar Yukt Safed Chandan",
      img: "⚪",
    },
    {
      id: 12,
      name: "Shyam Shri Chandan Tika",
      price: 250,
      category: "Chandan Tika · 30 gm",
      scent: "Premium Kala Chandan Tilak",
      img: "🫙",
    },
  ],
  care: [
    {
      id: 13,
      name: "Special Ubtan",
      price: 300,
      category: "Ubtan · 150 gm",
      scent: "Natural Ayurvedic Ubtan",
      img: "🌸",
      badge: "NATURAL",
    },
    {
      id: 14,
      name: "Gulab Ubtan",
      price: 300,
      category: "Ubtan · 150 gm",
      scent: "Natural Rose Petal Bath Powder",
      img: "🥀",
    },
    {
      id: 15,
      name: "Neem Ubtan",
      price: 300,
      category: "Ubtan · 150 gm",
      scent: "Herbal Purifying Body Scrub",
      img: "🌿",
    },
    {
      id: 16,
      name: "Naarangi Ubtan",
      price: 300,
      category: "Ubtan · 150 gm",
      scent: "Organic Orange Peel Glow",
      img: "🍊",
    },
  ],
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
    // Optional: show feedback
  };

  const renderProducts = (products) => (
    <div className="products-grid">
      {products.map((prod) => (
        <div key={prod.id} className="product-card reveal">
          <div className="product-img">
            {prod.img}
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
