import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import heroBanner from "../assets/Brand-Logo.png";
import "./Header.css";

const NAV_ITEMS = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Combos", "/combos"],
  ["About Us", "/about"],
  ["Contact", "/contact"],
];

const Header = ({ cartCount = 0, cartTotal = 0 }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSticky, setNavSticky] = useState(false);
  const closeMenu = () => setMenuOpen(false);

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
    const previousOverflow = document.body.style.overflow;

    if (menuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  return (
    <>
      <button
        type="button"
        className={`bm-overlay ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
        aria-label="Close menu"
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
      />

      <aside
        className={`bm-drawer ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
        aria-label="Navigation"
        aria-modal={menuOpen}
        role="dialog"
      >
        <div className="bm-drawer__head">
          <span className="bm-drawer__title">The Braj Madhuri</span>
          <button
            type="button"
            className="bm-drawer__close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <nav className="bm-drawer__nav">
          {NAV_ITEMS.map(([item, to]) => (
            <NavLink
              key={item}
              to={to}
              end={to === "/"}
              onClick={closeMenu}
              className={({ isActive }) =>
                `bm-drawer__link${isActive ? " active" : ""}`
              }
            >
              {item}
            </NavLink>
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
            type="button"
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
          <Link
            to="/shop"
            className="bm-cart"
            aria-label={`View collection. Cart has ${cartCount} item${cartCount === 1 ? "" : "s"} worth INR ${cartTotal.toLocaleString("en-IN")}.`}
          >
            <span className="bm-cart__icon" aria-hidden="true">
              Bag
            </span>
            <span className="bm-cart__label">
              {cartCount > 0 ? `INR ${cartTotal.toLocaleString("en-IN")}` : "Cart"}
            </span>
            {cartCount > 0 && (
              <span className="bm-cart__badge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
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
          {NAV_ITEMS.map(([item, to]) => (
            <NavLink
              key={item}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `bm-nav-link${isActive ? " active" : ""}`
              }
            >
              {item}
            </NavLink>
          ))}
        </div>
        <div className="bm-nav__mobile-bar">
          <Link className="bm-nav__mobile-title" to="/">
            The Braj Madhuri
          </Link>
          <button
            type="button"
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
