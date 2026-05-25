import React from "react";
import TrustBar from "../components/TrustBar.jsx";
import Story from "../components/Story.jsx";
import Reviews from "../components/Reviews.jsx";

function AboutPage() {
  return (
    <main className="page-shell">
      <section className="page-hero page-hero--about">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">About Us</span>
          <h1 className="page-hero__title">A devotional store rooted in Braj bhav.</h1>
          <p className="page-hero__body">
            The Braj Madhuri brings together spiritual essentials chosen with
            care, purity, and a sense of service for devotees across India.
          </p>
        </div>
      </section>

      <TrustBar />
      <Story />
      <Reviews />
    </main>
  );
}

export default AboutPage;
