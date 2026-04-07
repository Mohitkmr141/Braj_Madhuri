import React from "react";

const Footer = () => {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo">
            <div className="logo-name">VRINDAVAN MAHAK</div>
            <div className="logo-tagline">सुगंध वृंदावन की</div>
            <div className="logo-ornament"></div>
          </div>
          <div className="footer-about">
            Premium spiritual fragrances & poojan essentials, crafted with
            devotion in the sacred land of Vrindavan Dham.
          </div>
          <div className="footer-social">
            <button className="social-btn">📸</button>
            <button className="social-btn">▶️</button>
            <button className="social-btn">📘</button>
            <button className="social-btn">🛒</button>
          </div>
        </div>
        <div className="footer-col">
          <h4>PRODUCTS</h4>
          <ul className="footer-links">
            <li>
              <a href="#">Attars</a>
            </li>
            <li>
              <a href="#">Perfumes</a>
            </li>
            <li>
              <a href="#">Home Fragrance</a>
            </li>
            <li>
              <a href="#">Personal Care</a>
            </li>
            <li>
              <a href="#">Incense & Dhoop</a>
            </li>
            <li>
              <a href="#">Poojan Samagri</a>
            </li>
            <li>
              <a href="#">Combo Packs</a>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>QUICK LINKS</h4>
          <ul className="footer-links">
            <li>
              <a href="#">Home</a>
            </li>
            <li>
              <a href="#">About Us</a>
            </li>
            <li>
              <a href="#">Blogs</a>
            </li>
            <li>
              <a href="#">Order Tracking</a>
            </li>
            <li>
              <a href="#">Contact Us</a>
            </li>
            <li>
              <a href="#">Amazon Store</a>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>SUPPORT</h4>
          <ul className="footer-links">
            <li>
              <a href="#">Privacy Policy</a>
            </li>
            <li>
              <a href="#">Shipping & Delivery</a>
            </li>
            <li>
              <a href="#">Return & Refund Policy</a>
            </li>
            <li>
              <a href="#">Terms & Conditions</a>
            </li>
            <li>
              <a href="#">Leave a Review</a>
            </li>
          </ul>
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              background: "rgba(201,151,42,0.08)",
              border: "1px solid rgba(201,151,42,0.15)",
              borderRadius: "4px",
            }}
          >
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "11px",
                color: "var(--gold-light)",
                letterSpacing: "1px",
                marginBottom: "8px",
              }}
            >
              CONTACT US
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "rgba(250,245,236,0.4)",
                fontStyle: "italic",
              }}
            >
              vrindavanmahak@gmail.com
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "rgba(250,245,236,0.4)",
                fontStyle: "italic",
                marginTop: "4px",
              }}
            >
              Vrindavan Dham, UP
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          © 2025 Vrindavan Mahak · All rights reserved · Designed with Devotion
          in Vrindavan 🪷
        </p>
        <p style={{ marginTop: "6px", fontSize: "12px" }}>
          🙏 Jai Shri Krishna · Radhe Radhe
        </p>
      </div>
    </footer>
  );
};

export default Footer;
