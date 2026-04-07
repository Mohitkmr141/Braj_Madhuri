import React from "react";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-pattern"></div>
      <div className="hero-circle-1"></div>
      <div className="hero-circle-2"></div>
      <div className="hero-content">
        <div className="hero-badge">
          Premium Spiritual Brand from Vrindavan Dham
        </div>
        <h1 className="hero-title">
          Divine <span>Fragrances</span>
          <br />
          of Vrindavan
        </h1>
        <div className="hero-subtitle-devanagari">सुगंध वृंदावन की</div>
        <p className="hero-desc">
          Premium Attars, Perfumes, Poojan Samagri & more — crafted with purity,
          devotion, and the timeless essence of Vrindavan Dham.
        </p>
        <div className="hero-ctas">
          <a href="#bestsellers" className="btn-primary">
            SHOP NOW
          </a>
          <a href="#story" className="btn-outline">
            OUR STORY
          </a>
        </div>
      </div>
      <div className="hero-image-area">
        <div className="hero-image-placeholder">
          <svg
            className="hero-bottle-svg"
            viewBox="0 0 200 340"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="bottleGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stop-color="#C9972A" stop-opacity="0.9" />
                <stop offset="50%" stop-color="#E8721A" stop-opacity="0.7" />
                <stop offset="100%" stop-color="#C9972A" stop-opacity="0.5" />
              </linearGradient>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(201,151,42,0.3)" />
                <stop offset="30%" stop-color="rgba(232,114,26,0.5)" />
                <stop offset="70%" stop-color="rgba(201,151,42,0.4)" />
                <stop offset="100%" stop-color="rgba(74,44,26,0.3)" />
              </linearGradient>
            </defs>
            <rect
              x="85"
              y="40"
              width="30"
              height="60"
              rx="8"
              fill="url(#bottleGrad)"
              opacity="0.8"
            />
            <ellipse
              cx="100"
              cy="36"
              rx="20"
              ry="10"
              fill="#C9972A"
              opacity="0.9"
            />
            <rect
              x="82"
              y="20"
              width="36"
              height="20"
              rx="6"
              fill="url(#bottleGrad)"
            />
            <ellipse
              cx="100"
              cy="20"
              rx="18"
              ry="8"
              fill="#E8C96B"
              opacity="0.7"
            />
            <path
              d="M85 100 Q50 120 50 150 L50 270 Q50 290 70 295 L130 295 Q150 290 150 270 L150 150 Q150 120 115 100 Z"
              fill="url(#bodyGrad)"
            />
            <ellipse
              cx="78"
              cy="180"
              rx="6"
              ry="40"
              fill="rgba(255,255,255,0.15)"
              transform="rotate(-10 78 180)"
            />
            <rect
              x="62"
              y="160"
              width="76"
              height="90"
              rx="4"
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(201,151,42,0.4)"
              strokeWidth="1"
            />
            <text
              x="100"
              y="195"
              textAnchor="middle"
              fontFamily="serif"
              fontSize="9"
              fill="rgba(250,245,236,0.7)"
              fontWeight="300"
            >
              VRINDAVAN
            </text>
            <text
              x="100"
              y="208"
              textAnchor="middle"
              fontFamily="serif"
              fontSize="12"
              fill="#E8C96B"
              fontWeight="bold"
            >
              MAHAK
            </text>
            <text
              x="100"
              y="224"
              textAnchor="middle"
              fontFamily="serif"
              fontSize="7"
              fill="rgba(250,245,236,0.5)"
              fontStyle="italic"
            >
              Premium Attar
            </text>
            <ellipse
              cx="100"
              cy="294"
              rx="50"
              ry="10"
              fill="rgba(74,44,26,0.4)"
            />
            <circle cx="100" cy="135" r="3" fill="#E8C96B" opacity="0.6" />
            <circle cx="90" cy="140" r="2" fill="#E8C96B" opacity="0.4" />
            <circle cx="110" cy="140" r="2" fill="#E8C96B" opacity="0.4" />
          </svg>
        </div>
      </div>
      <div className="hero-stats">
        <div className="stat">
          <span className="stat-num">10,000+</span>
          <span className="stat-label">Happy Devotees</span>
        </div>
        <div className="stat">
          <span className="stat-num">4.9★</span>
          <span className="stat-label">Google Rating</span>
        </div>
        <div className="stat">
          <span className="stat-num">100+</span>
          <span className="stat-label">Divine Products</span>
        </div>
        <div className="stat">
          <span className="stat-num">Vrindavan</span>
          <span className="stat-label">Made Here</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
