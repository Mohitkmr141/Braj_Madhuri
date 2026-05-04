
import React, { useState, useEffect } from "react";
import heroBanner from "../assets/Brand-Logo.png";

const NAV_ITEMS = [
  "Home",
  "Shop",
  "Attars",
  "Perfumes",
  "Poojan Samagri",
  "Home Fragrance",
  "Combos",
  "Order Tracking",
  "About Us",
  "Contact",
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

  const css = `
    :root {
      --clr-primary:   #8b1a1a;
      --clr-primary-d: #6b1212;
      --clr-gold:      #c9973a;
      --clr-text:      #2c1a0e;
      --clr-surface:   #ffffff;
      --clr-bg:        #fffdf8;
      --nav-h:         46px;
      --font-display:  'Playfair Display', Georgia, serif;
      --font-body:     'Lato', sans-serif;
      --transition:    .22s cubic-bezier(.4,0,.2,1);
      --radius:        6px;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* === BANNER === */
    .bm-banner {
      position: relative;
      width: 100%;
      line-height: 0;
      background: #f5ede0;
    }
    /* Show full image — no fixed height, no cropping */
    .bm-banner__img {
      width: 100%;
      height: auto;
      display: block;
    }
    /* On very large monitors cap it so it doesn't fill the whole screen */
    @media (min-width: 1600px) {
      .bm-banner__img { max-height: 600px; object-fit: cover; }
    }

    /* Cart overlaid top-right of banner */
    .bm-banner__cart {
      position: absolute;
      top: 14px;
      right: clamp(12px, 3vw, 36px);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bm-cart {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: var(--clr-primary);
      color: #fff;
      border: none;
      border-radius: var(--radius);
      padding: 9px 18px;
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 2px 14px rgba(0,0,0,.32);
      transition: background var(--transition), transform var(--transition);
    }
    .bm-cart:hover { background: var(--clr-primary-d); transform: translateY(-1px); }
    .bm-cart__icon { font-size: 15px; }
    .bm-cart__label { display: none; }
    @media (min-width: 420px) { .bm-cart__label { display: inline; } }
    .bm-cart__badge {
      position: absolute;
      top: -7px; right: -7px;
      width: 19px; height: 19px;
      border-radius: 50%;
      background: var(--clr-gold);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Mobile hamburger overlaid inside banner (top-left) */
    .bm-banner__ham {
      position: absolute;
      top: 14px;
      left: clamp(12px, 3vw, 36px);
      z-index: 10;
    }
    .bm-hamburger {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 38px;
      height: 38px;
      background: var(--clr-primary);
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      padding: 9px 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,.3);
      flex-shrink: 0;
    }
    .bm-hamburger span {
      display: block;
      height: 2px;
      border-radius: 2px;
      background: #fff;
      transition: transform var(--transition), opacity var(--transition);
      transform-origin: center;
    }
    .bm-hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
    .bm-hamburger.open span:nth-child(2) { opacity: 0; }
    .bm-hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
    @media (min-width: 768px) {
      .bm-banner__ham { display: none; }
    }

    /* === NAV BAR === */
    .bm-nav-bar {
      background: var(--clr-primary);
      width: 100%;
      z-index: 1000;
      transition: box-shadow var(--transition);
    }
    .bm-nav-bar.sticky {
      position: fixed;
      top: 0; left: 0; right: 0;
      box-shadow: 0 3px 20px rgba(44,26,14,.26);
    }
    .bm-nav-spacer { display: none; height: var(--nav-h); }
    .bm-nav-spacer.active { display: block; }

    /* Desktop links */
    .bm-nav__inner {
      display: none;
      align-items: center;
      overflow-x: auto;
      scrollbar-width: none;
      padding: 0 clamp(12px, 3vw, 48px);
      gap: 0;
      height: var(--nav-h);
    }
    .bm-nav__inner::-webkit-scrollbar { display: none; }
    @media (min-width: 768px) { .bm-nav__inner { display: flex; } }

    .bm-nav-link {
      display: inline-flex;
      align-items: center;
      padding: 0 14px;
      height: 100%;
      color: rgba(255,255,255,.82);
      text-decoration: none;
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 500;
      letter-spacing: .03em;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: color var(--transition), border-color var(--transition), background var(--transition);
    }
    .bm-nav-link:hover { color: #fff; background: rgba(255,255,255,.09); }
    .bm-nav-link.active { color: var(--clr-gold); border-bottom-color: var(--clr-gold); font-weight: 700; }

    /* Mobile nav bar */
    .bm-nav__mobile-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      height: var(--nav-h);
    }
    @media (min-width: 768px) { .bm-nav__mobile-bar { display: none; } }
    .bm-nav__mobile-title {
      font-family: var(--font-display);
      font-size: 14px;
      color: rgba(255,255,255,.9);
    }
    .bm-hamburger-plain {
      width: 38px; height: 38px;
      background: transparent;
      border: 1.5px solid rgba(255,255,255,.4);
      box-shadow: none;
    }

    /* === MOBILE DRAWER === */
    .bm-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(44,26,14,.48);
      z-index: 1100;
    }
    .bm-overlay.open { display: block; }

    .bm-drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: min(290px, 84vw);
      background: var(--clr-surface);
      z-index: 1200;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform .28s cubic-bezier(.4,0,.2,1);
      box-shadow: -4px 0 32px rgba(44,26,14,.2);
    }
    .bm-drawer.open { transform: translateX(0); }

    .bm-drawer__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 20px;
      background: var(--clr-primary);
    }
    .bm-drawer__title { font-family: var(--font-display); font-size: 15px; color: #fff; font-weight: 600; }
    .bm-drawer__close {
      background: none; border: none;
      color: rgba(255,255,255,.8);
      font-size: 20px; cursor: pointer;
      padding: 2px 6px; border-radius: 4px; line-height: 1;
    }
    .bm-drawer__close:hover { background: rgba(255,255,255,.15); }

    .bm-drawer__nav { flex: 1; overflow-y: auto; padding: 6px 0; }
    .bm-drawer__link {
      display: flex;
      align-items: center;
      padding: 13px 20px;
      color: var(--clr-text);
      text-decoration: none;
      font-family: var(--font-body);
      font-size: 14px;
      font-weight: 500;
      border-left: 3px solid transparent;
      transition: background var(--transition), border-color var(--transition), color var(--transition);
    }
    .bm-drawer__link:hover { background: #fdf6ee; color: var(--clr-primary); }
    .bm-drawer__link.active {
      border-left-color: var(--clr-primary);
      color: var(--clr-primary);
      background: #fdf6ee;
      font-weight: 700;
    }
  `;

  return (
    <>
      <style>{css}</style>

      {/* Overlay */}
      <div
        className={`bm-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <aside
        className={`bm-drawer ${menuOpen ? "open" : ""}`}
        aria-label="Navigation"
      >
        <div className="bm-drawer__head">
          <span className="bm-drawer__title">The Braj Madhuri</span>
          <button
            className="bm-drawer__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <nav className="bm-drawer__nav">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href="#"
              className={`bm-drawer__link ${item === "Home" ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* Hero Banner — full width, natural height, no cropping */}
      <div className="bm-banner">
        <img
          src={heroBanner}
          alt="The Braj Madhuri – Attars & Fragrances"
          className="bm-banner__img"
          onError={(e) => {
            e.currentTarget.style.background = "#f5ede0";
            e.currentTarget.onerror = null;
          }}
        />

        {/* Hamburger top-left (mobile only) */}
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

        {/* Cart top-right — always visible */}
        <div className="bm-banner__cart">
          <a
            href="#cart"
            className="bm-cart"
            aria-label={`Cart – ${cartCount} items`}
          >
            <span className="bm-cart__icon" aria-hidden="true">
              🛒
            </span>
            <span className="bm-cart__label">
              {cartCount > 0 ? `₹${cartTotal.toLocaleString("en-IN")}` : "Cart"}
            </span>
            {cartCount > 0 && (
              <span className="bm-cart__badge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </a>
        </div>
      </div>

      {/* Spacer prevents jump when nav sticks */}
      <div
        className={`bm-nav-spacer ${navSticky ? "active" : ""}`}
        aria-hidden="true"
      />

      {/* Nav Bar */}
      <nav
        className={`bm-nav-bar ${navSticky ? "sticky" : ""}`}
        aria-label="Main navigation"
      >
        {/* Desktop */}
        <div className="bm-nav__inner">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href="#"
              className={`bm-nav-link ${item === "Home" ? "active" : ""}`}
            >
              {item}
            </a>
          ))}
        </div>
        {/* Mobile */}
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
