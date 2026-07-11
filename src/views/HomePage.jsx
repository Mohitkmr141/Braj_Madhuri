"use client";

import React from "react";
import { useRouter } from "next/navigation";

import TrustBar from "../components/TrustBar.jsx";
import FeaturedBanner from "../components/FeaturedBanner.jsx";
import ComboPacks from "../components/ComboPacks.jsx";
import Story from "../components/Story.jsx";
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

      <TrustBar />
      <CategoryGrid activeCategory={null} onExplore={handleExploreCategory} />
      <CategoryGalleries addToCart={addToCart} />
      <FeaturedBanner />
      <ComboPacks addToCart={addToCart} />
      <Story />
    </main>
  );
}

export default HomePage;
