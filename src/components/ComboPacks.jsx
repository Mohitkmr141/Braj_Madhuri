import React from "react";

const combos = [
  {
    title: "Daily Pooja Pack",
    items: ["Premium dhoop sticks", "Chandan tilak", "Hawan cups"],
    price: 399,
    save: "Save INR 80",
  },
  {
    title: "Japa Essentials",
    items: ["Tulsi mala", "Japa bag", "Sakshi mala"],
    price: 599,
    save: "Best for gifting",
  },
  {
    title: "Thakur Ji Seva",
    items: ["Poshak", "Vastra", "Shringar essentials"],
    price: 799,
    save: "Curated set",
  },
];

function ComboPacks({ addToCart }) {
  return (
    <section className="section" id="combos">
      <div className="section-header">
        <span className="section-eyebrow">Curated Sets</span>
        <h2 className="section-title">
          Seva <em>Combo Packs</em>
        </h2>
        <div className="section-divider" />
      </div>

      <div className="combo-grid">
        {combos.map((combo) => (
          <article className="combo-card reveal" key={combo.title}>
            <div className="combo-header">
              <div className="combo-icons" aria-hidden="true">
                🪷
              </div>
              <h3>{combo.title}</h3>
            </div>
            <div className="combo-body">
              <ul className="combo-items">
                {combo.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="combo-footer">
                <div>
                  <span className="combo-price">INR {combo.price}</span>
                  <div className="combo-save">{combo.save}</div>
                </div>
                <button
                  className="add-cart-btn"
                  type="button"
                  onClick={() => addToCart?.({
                    id: `combo-${combo.title.replace(/\s+/g, '-').toLowerCase()}`,
                    title: combo.title,
                    image: '/header-banner.jpg', // Placeholder for combos since they don't have images in data
                    price: combo.price,
                    originalPrice: null,
                    size: null
                  })}
                >
                  Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ComboPacks;
