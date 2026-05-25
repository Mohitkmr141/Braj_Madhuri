import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CategoryGalleries from "../components/Categories.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import FeaturedBanner from "../components/FeaturedBanner.jsx";

function ShopPage({ addToCart }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  const handleExploreCategory = (folder) => {
    if (folder) {
      navigate(`/shop?category=${encodeURIComponent(folder)}`);
      return;
    }

    navigate("/shop");
  };

  useEffect(() => {
    if (!activeCategory) {
      return;
    }

    document.getElementById("collections")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [activeCategory]);

  return (
    <main className="page-shell">
      <section className="page-hero page-hero--shop">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">Shop</span>
          <h1 className="page-hero__title">Browse devotional essentials with ease.</h1>
          <p className="page-hero__body">
            Explore curated collections for pooja, gifting, japa, fragrance,
            and daily seva. Use the category filter to move quickly through the
            catalog.
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
        onClearFilter={() => handleExploreCategory(null)}
      />
      <FeaturedBanner />
    </main>
  );
}

export default ShopPage;
