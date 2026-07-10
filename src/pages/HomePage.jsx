"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Hero from "../components/Hero.jsx";
import TrustBar from "../components/TrustBar.jsx";
import FeaturedBanner from "../components/FeaturedBanner.jsx";
import ComboPacks from "../components/ComboPacks.jsx";
import Story from "../components/Story.jsx";
import Reviews from "../components/Reviews.jsx";
import CategoryGalleries from "../components/Categories.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import { useCart } from "../context/CartContext.jsx";

function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();

  const handleExploreCategory = (folder) => {
    if (folder) {
      router.push(`/shop?category=${encodeURIComponent(folder)}`);
      return;
    }

    router.push("/shop");
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
