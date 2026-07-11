"use client";

import React from "react";
import Link from "next/link";
import ComboPacks from "../components/ComboPacks.jsx";
import { useCart } from "../context/CartContext.jsx";

function CombosPage() {
  const { addToCart } = useCart();

  return (
    <main className="page-shell">
      <section className="page-hero page-hero--combos">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">Combos</span>
          <h1 className="page-hero__title">Curated seva packs for daily worship and gifting.</h1>
          <p className="page-hero__body">
            These combinations are grouped to make shopping faster, simpler,
            and more meaningful for home mandirs and festive offerings.
          </p>
        </div>
      </section>

      <ComboPacks addToCart={addToCart} />

      <section className="route-cta reveal">
        <div>
          <span className="section-eyebrow">Need More Choices</span>
          <h2 className="section-title">Mix and match from the full collection.</h2>
        </div>
        <Link className="btn-primary" href="/shop">
          Visit Shop
        </Link>
      </section>
    </main>
  );
}

export default CombosPage;
