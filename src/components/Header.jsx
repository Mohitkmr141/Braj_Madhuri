"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import heroBanner from "../../public/header-banner.jpg";
import SearchBar from "./SearchBar.jsx";
import { useSession, signOut } from "next-auth/react";
import "./Header.css";

const NAV_ITEMS = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About Us", "/about"],
  ["Contact Us", "/contact"],
];

const Header = ({ cartCount = 0, cartTotal = 0, wishlistCount = 0 }) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [menuOpen, setMenuOpen]           = useState(false);
  const [navSticky, setNavSticky]         = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [accountOpen, setAccountOpen]     = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [globalSettings, setGlobalSettings] = useState(null);
  const accountRef = useRef(null);
  const closeMenu   = () => setMenuOpen(false);
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
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setGlobalSettings(data.settings);
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
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

  // Close account dropdown when clicking outside
  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountOpen]);

  return (
    <>
      {globalSettings?.isSaleActive && globalSettings?.saleTitle && (
        <div className="announcement-bar" style={{ backgroundColor: 'var(--maroon)', color: '#fff', textAlign: 'center', padding: '8px 16px', fontSize: '14px', fontWeight: 'bold' }}>
          {globalSettings.saleTitle}
        </div>
      )}
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
            {["Agarbatti", "Japa Mala", "Poshak", "Dhoop", "Chandan"].map((chip) => (
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
          <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "16px 24px" }} />
          {user ? (
            <button
              type="button"
              className="bm-drawer__link"
              onClick={() => { signOut(); closeMenu(); }}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link href="/login" onClick={closeMenu} className="bm-drawer__link">Sign In</Link>
              <Link href="/signup" onClick={closeMenu} className="bm-drawer__link" style={{ color: "#C9972A", fontWeight: "700" }}>Sign Up</Link>
            </>
          )}
        </nav>
      </aside>


      {pathname === "/" && (
        <div className="bm-banner">
          <Image
            src={heroBanner}
            alt="The Braj Madhuri"
            className="bm-banner__img"
            priority
            placeholder="blur"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
        </div>
      )}

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

          {/* Wishlist button */}
          <Link
            href="/wishlist"
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: "16px", color: 'white', textDecoration: 'none' }}
            aria-label={`Wishlist has ${wishlistCount} items`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {wishlistCount > 0 && (
              <span className="bm-cart__badge" style={{ top: "-5px", right: "-8px" }}>
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart button */}
          <Link
            href="/cart"
            style={{ position: 'relative', display: 'inline-block', marginLeft: "16px", marginRight: "16px" }}
            aria-label={`View collection. Cart has ${cartCount} item${cartCount === 1 ? "" : "s"} worth INR ${cartTotal.toLocaleString("en-IN")}.`}
          >
            <div className="bm-cart">
              <span className="bm-cart__icon" aria-hidden="true">
                <Image src="/cart-icon.png" alt="Cart" width={24} height={24} className="bm-cart__icon-img" />
              </span>
              <span className="bm-cart__label">
                {cartCount > 0 ? `INR ${cartTotal.toLocaleString("en-IN")}` : "Cart"}
              </span>
            </div>
            {cartCount > 0 && (
              <span className="bm-cart__badge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Account button — desktop */}
          {user ? (
            <div className="bm-account-wrap" ref={accountRef}>
              <button
                type="button"
                className="bm-account-btn bm-account-btn--user"
                onClick={() => setAccountOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={accountOpen}
                aria-label="Account menu"
              >
                <span className="bm-account-avatar">{(user.name || user.email || "U").charAt(0).toUpperCase()}</span>
                <span className="bm-account-name">{(user.name || user.email || "Account").split(" ")[0]}</span>
                <span className="bm-account-caret" aria-hidden="true">▾</span>
              </button>
              {accountOpen && (
                <div className="bm-account-dropdown" role="menu">
                  <div className="bm-account-dropdown__header">
                    <span className="bm-account-dropdown__name">{user.name || user.email}</span>
                    <span className="bm-account-dropdown__email">{user.email}</span>
                  </div>
                  <Link href="/" className="bm-account-dropdown__item" role="menuitem" onClick={() => setAccountOpen(false)}>
                    🏠 Home
                  </Link>
                  <Link href="/shop" className="bm-account-dropdown__item" role="menuitem" onClick={() => setAccountOpen(false)}>
                    🛍️ Shop
                  </Link>
                  <div className="bm-account-dropdown__divider" />
                  <button
                    type="button"
                    className="bm-account-dropdown__item bm-account-dropdown__item--logout"
                    role="menuitem"
                    onClick={() => { signOut(); setAccountOpen(false); }}
                  >
                    ← Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bm-auth-links">
              <Link href="/login" className="bm-auth-link">Sign In</Link>
              <Link href="/signup" className="bm-auth-link bm-auth-link--primary">Sign Up</Link>
            </div>
          )}
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
            {/* Wishlist Mobile */}
            <Link
              href="/wishlist"
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: "4px", color: 'white', textDecoration: 'none', marginLeft: "4px" }}
              aria-label={`Wishlist has ${wishlistCount} items`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {wishlistCount > 0 && (
                <span className="bm-cart__badge" style={{ top: "-2px", right: "-4px", width: "14px", height: "14px", fontSize: "8px" }}>
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            {/* Cart Mobile */}
            <Link
              href="/cart"
              style={{ position: 'relative', display: 'inline-block', marginLeft: "4px", marginRight: "4px" }}
              aria-label={`Cart has ${cartCount} items`}
            >
              <div className="bm-cart" style={{ padding: "4px 8px", minHeight: "auto" }}>
                <span className="bm-cart__icon" aria-hidden="true">
                  <Image src="/cart-icon.png" alt="Cart" className="bm-cart__icon-img" width={16} height={16} />
                </span>
              </div>
              {cartCount > 0 && (
                <span className="bm-cart__badge" style={{ top: "-5px", right: "-5px", width: "16px", height: "16px", fontSize: "9px" }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            {/* Mobile account */}
            {user ? (
              <button
                type="button"
                className="bm-account-btn bm-account-btn--user bm-account-btn--sm"
                onClick={() => { signOut(); }}
                aria-label="Sign out"
              >
                <span className="bm-account-avatar">{(user.name || user.email || "U").charAt(0).toUpperCase()}</span>
              </button>
            ) : (
              <Link href="/login" className="bm-auth-link bm-auth-link--primary bm-auth-link--sm">
                Sign In
              </Link>
            )}
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
