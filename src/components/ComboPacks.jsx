import React from "react";

const combos = [
  {
    id: 1,
    title: "VRINDAVAN SPECIAL ATTARS COMBO",
    icon: "🌺🌸🌼",
    items: [
      "Nidhivan Attar (12 ml)",
      "Vrindavan Flower Attar (12 ml)",
      "Vrindavan Vatika Attar (12 ml)",
      "Vrindavan Attar (12 ml)",
    ],
    price: 600,
    save: "Save ₹120 vs buying separate",
  },
  {
    id: 2,
    title: "DIVINE ATTARS COMBO",
    icon: "✨🙏✨",
    items: [
      "Shyam Ras Attar (12 ml)",
      "Panchamrit Attar (12 ml)",
      "Phool Bangla Attar (12 ml)",
      "Parmanand Attar (12 ml)",
    ],
    price: 920,
    save: "Most popular combo",
  },
  {
    id: 3,
    title: "DIVINE PERFUMES COMBO",
    icon: "🧴💫🧴",
    items: [
      "Phool Bangla Perfume (50 ml)",
      "Panchamrit Perfume (50 ml)",
      "Shyam Ras Perfume (50 ml)",
      "Parmanand Perfume (50 ml)",
    ],
    price: 1200,
    save: "For Thakur Ji Sewa",
  },
];

const ComboPacks = ({ addToCart }) => {
  return (
    <div style={{ background: "var(--ivory)", padding: "80px 0" }}>
      <div className="section">
        <div className="section-header">
          <span className="section-eyebrow">Save More</span>
          <h2 className="section-title">
            Special <em>Combo</em> Packs
          </h2>
          <div className="section-divider"></div>
        </div>
        <div className="combo-grid">
          {combos.map((combo) => (
            <div key={combo.id} className="combo-card reveal">
              <div className="combo-header">
                <div className="combo-icons">{combo.icon}</div>
                <h3>{combo.title}</h3>
              </div>
              <div className="combo-body">
                <ul className="combo-items">
                  {combo.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <div className="combo-footer">
                  <div>
                    <div className="combo-price">₹{combo.price}</div>
                    <div className="combo-save">{combo.save}</div>
                  </div>
                  <button
                    className="add-cart-btn"
                    onClick={() => addToCart(combo.price)}
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComboPacks;
