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
          <h1 className="page-hero__title">
            A devotional store rooted in Braj bhav.
          </h1>
          <p className="page-hero__body">
            At Braj Madhuri, our mission is simple—to serve devotees by making
            pure, authentic, and spiritually uplifting products from Braj Dham
            accessible to homes around the world. In a time when authenticity is
            often compromised, we remain committed to bringing you genuine
            devotional products sourced directly from Braj and trusted devotees.
            Whether it is Tulsi malas, Braj Raj, divine fragrances, puja
            samagri, deity accessories, floral offerings, or other devotional
            items, each product is selected with care, devotion, and reverence.
            We believe that the items used in the service of Thakur Ji should be
            as pure and authentic as the devotion with which they are offered.
            From seva essentials and puja samagri to sacred treasures of Braj,
            Braj Madhuri is dedicated to serving devotees with pure and
            authentic products they can trust. More than a store, Brajmadhuri is
            a humble effort to connect devotees with the sacred essence of Braj
            Dham, no matter where they are in the world, and to make authentic
            devotional products accessible to every home. Braj Madhuri – In the
            Sacred Service of Thakur Ji and His Devotees.
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
