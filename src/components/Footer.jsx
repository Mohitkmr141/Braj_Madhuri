import React from "react";
import Link from "next/link";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__links">
        <Link href="/return-and-refund-policy" className="site-footer__link">
          Return & Refund Policy
        </Link>
        <Link href="/shipping-policy" className="site-footer__link">
          Shipping Policy
        </Link>
      </div>
      <p className="site-footer__copy">
        &copy; {currentYear} The Braj Madhuri. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
