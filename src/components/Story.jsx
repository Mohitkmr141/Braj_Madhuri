import React from "react";

const Story = () => {
  return (
    <section className="story-section" id="story">
      <div className="story-inner">
        <div className="story-visual">
          <div className="story-big-box">
            <div className="story-big-text">VM</div>
            <div className="story-big-icon">🪷</div>
            <div className="story-big-label">वृंदावन महक</div>
          </div>
          <div className="story-float-card top-right">
            <span className="float-num">4.9★</span>
            <span className="float-label">Google Rating</span>
          </div>
          <div className="story-float-card bottom-left">
            <span className="float-num">10,000+</span>
            <span className="float-label">Devotees Served</span>
          </div>
        </div>
        <div className="story-text reveal">
          <span className="section-eyebrow">Who We Are</span>
          <h2>
            Born in <em>Vrindavan,</em>
            <br />
            Crafted with Devotion
          </h2>
          <div className="section-divider" style={{ margin: "20px 0" }}></div>
          <p>
            Vrindavan Mahak was established in Vrindavan Dham, devoted to
            offering premium spiritual essentials for Pooja. We believe that
            fragrance is the language of devotion — a bridge between the devotee
            and the divine.
          </p>
          <p>
            From our Attars and Perfumes to Chandan Tika, Ubtan, Agarbatti, and
            Dhoop Sticks, every product is crafted with purity, devotion, and
            uncompromising quality — inspired by the bhakti of Shri Krishna's
            eternal abode.
          </p>
          <div className="story-values">
            <div className="value-item">
              <span className="value-icon">🌿</span>
              <div>
                <span className="value-title">NATURAL PURITY</span>
                <span className="value-desc">
                  Only natural, alcohol-free ingredients in our attars
                </span>
              </div>
            </div>
            <div className="value-item">
              <span className="value-icon">🙏</span>
              <div>
                <span className="value-title">DEVOTIONAL CRAFT</span>
                <span className="value-desc">
                  Made with bhakti and dedication in Vrindavan
                </span>
              </div>
            </div>
            <div className="value-item">
              <span className="value-icon">⭐</span>
              <div>
                <span className="value-title">PREMIUM QUALITY</span>
                <span className="value-desc">
                  Rated #1 Spiritual Brand on Amazon India
                </span>
              </div>
            </div>
            <div className="value-item">
              <span className="value-icon">📦</span>
              <div>
                <span className="value-title">SWIFT DELIVERY</span>
                <span className="value-desc">
                  Pan-India delivery with careful packaging
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;
