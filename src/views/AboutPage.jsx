import React from "react";
import Image from "next/image";
import TrustBar from "../components/TrustBar.jsx";
import Story from "../components/Story.jsx";
import "./AboutPage.css";

function AboutPage() {
  return (
    <main className="page-shell">
      <section className="page-hero page-hero--about">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">About Us</span>
          <h1 className="page-hero__title">
            A Devotional Store Rooted in Braj Bhav
          </h1>
          <p className="page-hero__body">
            At Braj Madhuri, our mission is to bring pure, authentic devotional
            treasures from Braj Dham to devotees across the world.
          </p>
        </div>
      </section>

      <section className="about-details">
        <div className="about-details__container">
          <div className="about-details__grid">
            {/* Column 1: Sourced with Devotion */}
            <div className="about-card">
              <div className="about-card__img-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <Image 
                  src="/First.jpeg" 
                  alt="Sourced with Devotion" 
                  width={100} 
                  height={100} 
                  style={{ borderRadius: '50%', objectFit: 'cover' }} 
                />
              </div>
              <h2 className="about-card__title">Sourced with Devotion</h2>
              <p className="about-card__text">
                In a time when authenticity is often compromised, we remain
                committed to bringing you genuine devotional products sourced
                directly from Braj and trusted devotees. Each item is selected
                with care, devotion, and reverence.
              </p>
            </div>

            {/* Column 2: Purity in Seva */}
            <div className="about-card">
              <div className="about-card__img-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <Image 
                  src="/Second.jpeg" 
                  alt="Lotus" 
                  width={100} 
                  height={100} 
                  style={{ borderRadius: '50%', objectFit: 'cover' }} 
                />
              </div>
              <h2 className="about-card__title">Purity in Seva</h2>
              <p className="about-card__text">
                We believe that the items used in the service of Thakur Ji
                should be as pure and authentic as the devotion with which they
                are offered. From daily essentials to sacred treasures, quality
                is our promise.
              </p>
            </div>

            {/* Column 3: Connecting Hearts */}
            <div className="about-card">
              <div className="about-card__img-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <Image 
                  src="/Third.jpeg" 
                  alt="Connecting Hearts" 
                  width={100} 
                  height={100} 
                  style={{ borderRadius: '50%', objectFit: 'cover' }} 
                />
              </div>
              <h2 className="about-card__title">Connecting Hearts</h2>
              <p className="about-card__text">
                More than a store, Braj Madhuri is a humble effort to connect
                devotees with the sacred essence of Braj Dham, no matter where
                they are in the world, bringing Vrindavan closer to every home.
              </p>
            </div>
          </div>

          <div className="about-quote">
            <blockquote>
              The Braj Madhuri — In Sacred Service of Devotees.
            </blockquote>
          </div>
        </div>
      </section>

      <TrustBar />
      <Story />
    </main>
  );
}

export default AboutPage;