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
  ["Bestsellers 🔥", "/bestsellers"],
  ["About Us", "/about"],
  ["Contact Us", "/contact"],
];

const Header = ({ cartCount = 0, cartTotal = 0, wishlistCount = 0 }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSticky, setNavSticky] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [globalSettings, setGlobalSettings] = useState(null);
  const accountRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);
  const closeSearch = () => {
    setSearchOpen(false);
    setSuggestionQuery("");
  };
  const isActive = (to) => (to === "/" ? pathname === "/" : pathname === to);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setNavSticky((prev) => {
            const isSticky = window.scrollY > 10;
            return prev !== isSticky ? isSticky : prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
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
        const res = await fetch("/api/settings");
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
    if (menuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (searchOpen) closeSearch();
        if (menuOpen) closeMenu();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen, searchOpen]);

  // Close account dropdown when clicking outside
  useEffect(() => {
    if (!accountOpen) return;
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [accountOpen]);

  return (
    <>
      {globalSettings?.isSaleActive &&
        (globalSettings?.saleTitle || globalSettings?.saleDiscountPercentage > 0) && (
          <div className="bm-announcement-bar">
            <span>
              {globalSettings.saleTitle ||
                `🎉 SPECIAL SALE: FLAT ${globalSettings.saleDiscountPercentage}% OFF Sitewide on All Orders!`}
            </span>
          </div>
        )}

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="search-overlay"
          role="dialog"
          aria-label="Search"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSearch();
          }}
        >
          <p className="search-overlay__heading">What are you looking for?</p>
          <p className="search-overlay__subheading">
            Search our entire devotional collection
          </p>
          <div className="search-overlay__inner">
            <SearchBar onClose={closeSearch} initialQuery={suggestionQuery} />
            <button
              type="button"
              className="search-overlay__close"
              onClick={closeSearch}
              aria-label="Close search"
            >
              ✕
            </button>
          </div>
          <div className="search-suggestions" aria-label="Popular searches">
            {["Agarbatti", "Japa Mala", "Poshak", "Dhoop", "Chandan"].map(
              (chip) => (
                <button
                  key={chip}
                  type="button"
                  className="search-suggestion-chip"
                  onClick={() => setSuggestionQuery(chip)}
                >
                  {chip}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      <button
        type="button"
        className={`bm-overlay ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
        aria-label="Close menu"
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
      />

      {/* Mobile Drawer */}
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
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <nav className="bm-drawer__nav">
          {user ? (
            <div className="bm-drawer__user-card">
              <div className="bm-drawer__user-avatar">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="bm-drawer__user-meta">
                <span className="bm-drawer__user-name">{user.name || "Devotee"}</span>
                <span className="bm-drawer__user-email">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="bm-drawer__auth-group">
              <Link
                href="/login"
                onClick={closeMenu}
                className="bm-drawer__auth-btn bm-drawer__auth-btn--login"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={closeMenu}
                className="bm-drawer__auth-btn bm-drawer__auth-btn--signup"
              >
                Create Account
              </Link>
            </div>
          )}

          <div className="bm-drawer__divider" />

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

          {user && (
            <>
              <div className="bm-drawer__divider" />
              <button
                type="button"
                className="bm-drawer__link bm-drawer__link--logout"
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
              >
                ← Sign Out
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* Hero Banner (Homepage only) */}
      {pathname === "/" && (
        <div className="bm-banner">
          {globalSettings?.isSaleActive && globalSettings?.saleBannerUrl ? (
            <Image
              src={globalSettings.saleBannerUrl}
              alt={globalSettings.saleTitle || "The Braj Madhuri Special Sale"}
              className="bm-banner__img"
              priority
              width={1920}
              height={600}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "500px",
                objectFit: "cover",
              }}
            />
          ) : (
            <Image
              src={heroBanner}
              alt="The Braj Madhuri"
              className="bm-banner__img"
              priority
              placeholder="blur"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav
        className={`bm-nav-bar ${navSticky ? "sticky" : ""}`}
        aria-label="Main navigation"
      >
        {/* Desktop Navigation Row */}
        <div className="bm-nav__inner">
          <Link href="/" className="bm-nav__brand">
            The Braj Madhuri
          </Link>

          <div className="bm-nav__links">
            {NAV_ITEMS.map(([item, to]) => (
              <Link
                key={item}
                href={to}
                className={`bm-nav-link${isActive(to) ? " active" : ""}`}
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="bm-nav__desktop-actions">
            {/* Search Button */}
            <button
              type="button"
              className="header-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search</span>
            </button>

            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              className="bm-icon-btn"
              aria-label={`Wishlist – ${wishlistCount} items`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="bm-icon-btn__badge">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="bm-cart-pill"
              aria-label={`Cart – ${cartCount} items`}
            >
              <span className="bm-cart-pill__icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </span>
              <span className="bm-cart-pill__label">
                {cartCount > 0
                  ? `₹${cartTotal.toLocaleString("en-IN")}`
                  : "Cart"}
              </span>
              {cartCount > 0 && (
                <span className="bm-cart-pill__badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Account / Auth */}
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
                  <span className="bm-account-avatar">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                  <span className="bm-account-name">
                    {(user.name || user.email || "Account").split(" ")[0]}
                  </span>
                  <span className="bm-account-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>
                {accountOpen && (
                  <div className="bm-account-dropdown" role="menu">
                    <div className="bm-account-dropdown__header">
                      <span className="bm-account-dropdown__name">
                        {user.name || user.email}
                      </span>
                      <span className="bm-account-dropdown__email">
                        {user.email}
                      </span>
                    </div>
                    <Link
                      href="/"
                      className="bm-account-dropdown__item"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      🏠 Home
                    </Link>
                    <Link
                      href="/shop"
                      className="bm-account-dropdown__item"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      🛍️ Shop
                    </Link>
                    <div className="bm-account-dropdown__divider" />
                    <button
                      type="button"
                      className="bm-account-dropdown__item bm-account-dropdown__item--logout"
                      role="menuitem"
                      onClick={() => {
                        signOut();
                        setAccountOpen(false);
                      }}
                    >
                      ← Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bm-auth-links">
                <Link href="/login" className="bm-auth-link">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bm-auth-link bm-auth-link--primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="bm-nav__mobile-bar">
          <Link className="bm-nav__mobile-title" href="/">
            The Braj Madhuri
          </Link>

          <div className="bm-nav__mobile-actions">
            {/* Search */}
            <button
              type="button"
              className="bm-icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="bm-icon-btn"
              aria-label={`Wishlist – ${wishlistCount} items`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="bm-icon-btn__badge">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="bm-icon-btn bm-icon-btn--cart"
              aria-label={`Cart – ${cartCount} items`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="bm-icon-btn__badge bm-icon-btn__badge--gold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              className={`bm-hamburger-plain ${menuOpen ? "open" : ""}`}
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
