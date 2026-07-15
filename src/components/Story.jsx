import React from "react";

const values = [
  ["Natural Purity", "Carefully selected ingredients for devotional use"],
  ["Devotional Craft", "Made with bhakti and dedication in Vrindavan"],
  ["Premium Quality", "Thoughtful products for daily seva and gifting"],
  ["Swift Delivery", "Pan-India delivery with careful packaging"],
];

const Story = () => {
  return (
    <section className="story-section" id="story">
      <div className="story-inner">
        <div className="story-visual">
          <div className="story-big-box">
            <div className="story-big-text">BM</div>
            <div className="story-big-icon" aria-hidden="true">
              🪷
            </div>
            <div className="story-big-label">Braj Madhuri</div>
          </div>


        </div>
        <div className="story-text reveal">
          <span className="section-eyebrow">Who We Are</span>
          <h2>
            Born in <em>Vrindavan,</em>
            <br />
            Crafted with Devotion
          </h2>
          <div className="section-divider" style={{ margin: "20px 0" }} />
          <p>
            The Braj Madhuri brings together spiritual essentials for pooja,
            gifting, and daily seva. Every collection is chosen with attention
            to purity, presentation, and the devotional feeling of Braj.
          </p>
          <p>
            From dhoop sticks and chandan tilak to poshak, vastra, japa mala,
            and shringar items, the store is designed to help devotees find
            beautiful essentials in one place.
          </p>
          <div className="story-values">
            {values.map(([title, desc]) => (
              <div className="value-item" key={title}>
                <span className="value-icon" aria-hidden="true">
                  ✦
                </span>
                <div>
                  <span className="value-title">{title}</span>
                  <span className="value-desc">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;
