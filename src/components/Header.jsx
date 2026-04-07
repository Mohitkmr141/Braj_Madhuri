import React from "react";
import logo from "../assets/logo.png"; // better: import the image

const Header = ({ cartCount = 0, cartTotal = 0 }) => {
  return (
    <header>
      <div className="header-top">
        <div className="logo-wrapper">
          <div className="logo-img">
            <img
              src={logo} // use imported variable
              alt="The Braj Madhuri Logo"
              onError={(e) =>
                (e.target.src = "https://placehold.co/80x80?text=Logo")
              }
            />
          </div>
          <div className="logo-text">
            <div className="logo-name">The Braj Madhuri</div>
            <div className="logo-tagline">Meenakshi Vashisht</div>
            <div className="logo-ornament"></div>
          </div>
        </div>

        <div className="header-icons">
          <button className="icon-btn" aria-label="Search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Search
          </button>

          <button className="icon-btn" aria-label="Wishlist">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Wishlist
          </button>

          <button className="icon-btn" aria-label="Login">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Login
          </button>

          <button
            className="cart-btn"
            aria-label={`Cart with ${cartCount} items, total ₹${cartTotal}`}
          >
            🛒 Cart ({cartCount}) &nbsp;₹{cartTotal}
          </button>
        </div>
      </div>

      <nav>
        <div className="nav-inner">
          {[
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
          ].map((item) => (
            <a
              key={item}
              href="#"
              className={`nav-link ${item === "Home" ? "active" : ""}`}
            >
              {item}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
};



export default Header;
