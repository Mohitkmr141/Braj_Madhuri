"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryGalleries from "../components/Categories.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import FeaturedBanner from "../components/FeaturedBanner.jsx";
import SubcategoryPage from "../components/SubcategoryPage.jsx";
import { useCart } from "../context/CartContext.jsx";
import CATEGORIES from "../data/categoriesData.js";

function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const activeCategory = searchParams.get("category");
  const searchQuery = searchParams.get("search");
  const activeProductId = searchParams.get("product");

  // Parse compound subcategory key "catId::SubName"
  const isSubcategory = activeCategory?.includes("::");
  const [catId, subName] = isSubcategory
    ? activeCategory.split("::", 2)
    : [null, null];
  const catLabel =
    CATEGORIES.find((c) => c.id === catId)?.label ?? catId ?? "";

  const handleExploreCategory = (folder) => {
    if (folder) {
      router.push(`/shop?category=${encodeURIComponent(folder)}`);
      return;
    }
    router.push("/shop");
  };

  useEffect(() => {
    if (!activeCategory) return;
    // Only scroll to collections grid for non-subcategory filters
    if (!isSubcategory) {
      document.getElementById("collections")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      // Scroll to top of page for product detail view
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeCategory, isSubcategory]);

  // ── Subcategory product detail view ───────────────────────────────────────
  if (isSubcategory) {
    return (
      <main className="page-shell">
        <SubcategoryPage
          catId={catId}
          subName={subName}
          catLabel={catLabel}
          addToCart={addToCart}
          onBack={() => router.push("/shop")}
          onBackToCategory={() =>
            router.push(`/shop?category=${encodeURIComponent(catId)}`)
          }
        />
        <FeaturedBanner />
      </main>
    );
  }

  // ── Normal shop / category filter view ────────────────────────────────────
  return (
    <main className="page-shell">
      <section className="page-hero page-hero--shop">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">Shop</span>
          <h1 className="page-hero__title">Discover Pure Devotional Essentials</h1>
          <p className="page-hero__body">
            Explore authentic collections from Braj Dham for daily seva, japa, pooja, 
            Thakur Ji shringar, fragrances, and thoughtful gifting. Use the category filter 
            to find exactly what you need
          </p>
        </div>
      </section>

      <CategoryGrid
        activeCategory={activeCategory}
        onExplore={handleExploreCategory}
      />
      <CategoryGalleries
        addToCart={addToCart}
        filterFolder={activeCategory}
        searchQuery={searchQuery}
        activeProductId={activeProductId}
        onClearFilter={() => handleExploreCategory(null)}
      />
      <FeaturedBanner />
    </main>
  );
}

export default ShopPage;
