import React from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import TrustBar from "../components/TrustBar.jsx";
import FeaturedBanner from "../components/FeaturedBanner.jsx";
import ComboPacks from "../components/ComboPacks.jsx";
import Story from "../components/Story.jsx";
import Reviews from "../components/Reviews.jsx";
import CategoryGalleries from "../components/Categories.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";

function HomePage({ addToCart }) {
  const navigate = useNavigate();

  const handleExploreCategory = (folder) => {
    if (folder) {
      navigate(`/shop?category=${encodeURIComponent(folder)}`);
      return;
    }

    navigate("/shop");
  };

  return (
    <main>
      <Hero />
      <TrustBar />
      <CategoryGrid activeCategory={null} onExplore={handleExploreCategory} />
      <CategoryGalleries addToCart={addToCart} />
      <FeaturedBanner />
      <ComboPacks addToCart={addToCart} />
      <Story />
      <Reviews />
    </main>
  );
}

export default HomePage;
