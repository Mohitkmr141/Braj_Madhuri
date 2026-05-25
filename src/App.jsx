import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import TrustBar from "./components/TrustBar.jsx";
import FeaturedBanner from "./components/FeaturedBanner.jsx";
import ComboPacks from "./components/ComboPacks.jsx";
import Story from "./components/Story.jsx";
import Reviews from "./components/Reviews.jsx";
import Newsletter from "./components/Newsletter.jsx";
import Footer from "./components/Footer.jsx";
import FloatingCart from "./components/FloatingCart.jsx";
import CategoryGalleries from "./components/Categories.jsx";
import CategoryGrid from "./components/CategoryGrid.jsx";

function App() {
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);

  const addToCart = (price = 250) => {
    setCartCount((prev) => prev + 1);
    setCartTotal((prev) => prev + price);
  };

  const cartAnnouncement = useMemo(() => {
    if (cartCount === 0) {
      return "Cart is empty.";
    }

    return `${cartCount} item${cartCount === 1 ? "" : "s"} in cart totaling INR ${cartTotal.toLocaleString("en-IN")}.`;
  }, [cartCount, cartTotal]);

  const handleExploreCategory = (folder = null) => {
    setActiveCategory(folder);
    document.getElementById("collections")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const revealTargets = [...document.querySelectorAll(".reveal")];
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      revealTargets.forEach((element) => element.classList.add("visible"));
      return undefined;
    }

    const timers = [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const timer = window.setTimeout(() => {
              entry.target.classList.add("visible");
            }, index * 80);
            timers.push(timer);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    revealTargets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <>
      <p className="visually-hidden" aria-live="polite">
        {cartAnnouncement}
      </p>
      <Header cartCount={cartCount} cartTotal={cartTotal} />
      <Hero />
      <TrustBar />
      <CategoryGrid
        activeCategory={activeCategory}
        onExplore={handleExploreCategory}
      />
      <CategoryGalleries
        addToCart={addToCart}
        filterFolder={activeCategory}
        onClearFilter={() => handleExploreCategory(null)}
      />
      <FeaturedBanner />
      <ComboPacks addToCart={addToCart} />
      <Story />
      <Reviews />
      <Newsletter />
      <Footer />
      <FloatingCart cartCount={cartCount} cartTotal={cartTotal} />
    </>
  );
}

export default App;
