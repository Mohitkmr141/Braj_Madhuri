"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import heroBanner from "../../public/Brand-Logo.jpeg";
import SearchBar from "./SearchBar.jsx";
import "./Header.css";

const NAV_ITEMS = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Combos", "/combos"],
  ["About Us", "/about"],
  ["Contact", "/contact"],
];

const Header = ({ cartCount = 0, cartTotal = 0 }) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSticky, setNavSticky] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const closeMenu = () => setMenuOpen(false);
  const closeSearch = () => { setSearchOpen(false); setSuggestionQuery(""); };
  const isActive = (to) => (to === "/" ? pathname === "/" : pathname === to);

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
      {/* Search Overlay */}
      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-label="Search" onClick={(e) => { if (e.target === e.currentTarget) closeSearch(); }}>
          <p className="search-overlay__heading">What are you looking for?</p>
          <p className="search-overlay__subheading">Search our entire devotional collection</p>
          <div className="search-overlay__inner">
            <SearchBar onClose={closeSearch} initialQuery={suggestionQuery} />
            <button
              type="button"
              className="search-overlay__close"
              onClick={closeSearch}
              aria-label="Close search"
            >
              ×
            </button>
          </div>
          <div className="search-suggestions" aria-label="Popular searches">
            {["Agarbatti", "Japa Mala", "Poshak", "Dhoop", "Chandan", "Combo Pack"].map((chip) => (
              <button
                key={chip}
                type="button"
                className="search-suggestion-chip"
                onClick={() => {
                  setSuggestionQuery(chip);
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}
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
            <Link
              key={item}
              href={to}
              onClick={closeMenu}
              className={`bm-drawer__link${isActive(to) ? " active" : ""}`}
            >
              {item}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="bm-banner">
        <img
          src={heroBanner.src}
          alt="The Braj Madhuri"
          className="bm-banner__img"
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
            href="/shop"
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
        {/* Desktop nav links */}
        <div className="bm-nav__inner">
          {NAV_ITEMS.map(([item, to]) => (
            <Link
              key={item}
              href={to}
              className={`bm-nav-link${isActive(to) ? " active" : ""}`}
            >
              {item}
            </Link>
          ))}
          {/* Search button */}
          <button
            type="button"
            className="header-search-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            style={{ marginLeft: "auto" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search</span>
          </button>
        </div>
        <div className="bm-nav__mobile-bar">
          <Link className="bm-nav__mobile-title" href="/">
            The Braj Madhuri
          </Link>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="header-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
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
        </div>
      </nav>
    </>
  );
};

export default Header;
