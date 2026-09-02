"use client";

import React from "react";
import CategoryGalleries from "../components/Categories.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function BestsellersPage() {
  const { addToCart } = useCart();

  return (
    <main className="page-shell">
      <section className="page-hero page-hero--shop">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">Top Rated</span>
          <h1 className="page-hero__title">Our Bestsellers</h1>
          <p className="page-hero__body">
            Explore the most loved and trending devotional items from our store.
            These items are highly rated and frequently bought by our customers.
          </p>
        </div>
      </section>

      <CategoryGalleries
        addToCart={addToCart}
        filterFolder="bestsellers"
        searchQuery=""
        onClearFilter={() => {}}
      />
    </main>
  );
}
