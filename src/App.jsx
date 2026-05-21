import React, { useState, useEffect } from "react";
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

  const addToCart = (price = 250) => {
    setCartCount((prev) => prev + 1);
    setCartTotal((prev) => prev + price);
  };

  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), i * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header cartCount={cartCount} cartTotal={cartTotal} />
      <Hero />
      <TrustBar />
      <CategoryGrid onExplore={(folder) => setActiveCategory(folder)} />
      <CategoryGalleries filterFolder={activeCategory} addToCart={addToCart} />
      <FeaturedBanner />
      <ComboPacks addToCart={addToCart} />
      <Story />
      <Reviews />
      <Newsletter />
      <Footer />
      <FloatingCart cartCount={cartCount} />
    </>
  );
}

export default App;


