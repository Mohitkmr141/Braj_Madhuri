import React from "react";

const Footer = () => {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo-name">The Braj Madhuri</div>
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
          <a
            href="https://youtube.com/@YOUR_HANDLE"
            target="_blank"
            rel="noreferrer"
            className="social-btn"
          >
            YouTube
          </a>
          <a
            href="https://facebook.com/YOUR_HANDLE"
            target="_blank"
            rel="noreferrer"
            className="social-btn"
          >
            Facebook
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
        <p>Copyright 2026 The Braj Madhuri. All rights reserved.</p>
        <p>Jai Shri Krishna. Radhe Radhe.</p>
      </div>
    </footer>
  );
};

export default Footer;
