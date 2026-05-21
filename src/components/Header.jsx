import React, { useState, useEffect } from "react";
import heroBanner from "../assets/Brand-Logo.png";
import "./Header.css";

const NAV_ITEMS = [
  ["Home", "#home"],
  ["Shop", "#collections"],
  ["Combos", "#combos"],
  ["About Us", "#story"],
  ["Contact", "mailto:brajmadhuriofficial@gmail.com"],
];

const Header = ({ cartCount = 0, cartTotal = 0 }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSticky, setNavSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavSticky(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <div
        className={`bm-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`bm-drawer ${menuOpen ? "open" : ""}`}
        aria-label="Navigation"
      >
        <div className="bm-drawer__head">
          <span className="bm-drawer__title">The Braj Madhuri</span>
          <button
            className="bm-drawer__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            X
          </button>
        </div>
        <nav className="bm-drawer__nav">
          {NAV_ITEMS.map(([item, href]) => (
            <a
              key={item}
              href={href}
              className={`bm-drawer__link ${item === "Home" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <div className="bm-banner">
        <img
          src={heroBanner}
          alt="The Braj Madhuri"
          className="bm-banner__img"
          onError={(e) => {
            e.currentTarget.style.background = "#f5ede0";
            e.currentTarget.onerror = null;
          }}
        />

        <div className="bm-banner__ham">
          <button
            className={`bm-hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className="bm-banner__cart">
          <a
            href="#collections"
            className="bm-cart"
            aria-label={`Cart: ${cartCount} items`}
          >
            <span className="bm-cart__icon" aria-hidden="true">
              Cart
            </span>
            <span className="bm-cart__label">
              {cartCount > 0 ? `INR ${cartTotal.toLocaleString("en-IN")}` : "Cart"}
            </span>
            {cartCount > 0 && (
              <span className="bm-cart__badge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </a>
        </div>
      </div>

      <div
        className={`bm-nav-spacer ${navSticky ? "active" : ""}`}
        aria-hidden="true"
      />

      <nav
        className={`bm-nav-bar ${navSticky ? "sticky" : ""}`}
        aria-label="Main navigation"
      >
        <div className="bm-nav__inner">
          {NAV_ITEMS.map(([item, href]) => (
            <a
              key={item}
              href={href}
              className={`bm-nav-link ${item === "Home" ? "active" : ""}`}
            >
              {item}
            </a>
          ))}
        </div>
        <div className="bm-nav__mobile-bar">
          <span className="bm-nav__mobile-title">The Braj Madhuri</span>
          <button
            className={`bm-hamburger bm-hamburger-plain ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
    </>
  );
};

export default Header;
