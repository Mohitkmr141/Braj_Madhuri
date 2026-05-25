import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo-name">The Braj Madhuri</div>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/combos">Combos</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-social">
          <a
            href="https://www.instagram.com/brajmadhuri.official"
            target="_blank"
            rel="noreferrer"
            className="social-btn"
          >
            Instagram
          </a>
        </div>

        <div className="footer-contact">
          <a href="tel:+918448904455">+91 84489 04455</a>
          <a href="mailto:brajmadhuriofficial@gmail.com">
            brajmadhuriofficial@gmail.com
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright {currentYear} The Braj Madhuri. All rights reserved.</p>
        <p>Jai Shri Krishna. Radhe Radhe.</p>
      </div>
    </footer>
  );
};

export default Footer;
