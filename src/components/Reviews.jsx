"use client";

import React, { useEffect, useRef } from "react";
import "./Reviews.css";

const REVIEWS = [
  {
    name: "Mohit Kumar",
    initial: "M",
    location: "Delhi",
    rating: 5,
    text: "Bahut hi sundar products hain, Radhe Radhe! Agarbatti ki khushboo bahut achhi hai.",
    product: "Agarbatti Collection",
    color: "#C9972A",
  },
  {
    name: "Priya Sharma",
    initial: "P",
    location: "Mathura",
    rating: 5,
    text: "Thakur Ji ki poshak ekdum original aur sundar hai. Braj Dham se aane ki feeling aati hai!",
    product: "Thakur Ji Poshak",
    color: "#4A1521",
  },
  {
    name: "Anita Devi",
    initial: "A",
    location: "Vrindavan",
    rating: 5,
    text: "Japa mala bahut hi achhi quality ki hai. Fast delivery bhi mili. Highly recommended!",
    product: "Japa Mala",
    color: "#7B3F00",
  },
  {
    name: "Sunita Gupta",
    initial: "S",
    location: "Jaipur",
    rating: 5,
    text: "Sab kuch bilkul authentic hai. Attar ki khushboo man ko prasann kar deti hai. Radhe Radhe!",
    product: "Attar Collection",
    color: "#1B5E20",
  },
  {
    name: "Rajesh Mishra",
    initial: "R",
    location: "Lucknow",
    rating: 5,
    text: "Pehli baar order kiya tha, experience bahut achha raha. Packaging bhi bahut careful thi.",
    product: "First Order",
    color: "#0D47A1",
  },
  {
    name: "Deepa Verma",
    initial: "D",
    location: "Mumbai",
    rating: 5,
    text: "The Braj Madhuri se products le kar dil khush ho gaya. Sab products premium quality ke hain.",
    product: "Multiple Products",
    color: "#4A148C",
  },
];

const StarRating = ({ count }) => (
  <div className="review-stars" aria-label={`${count} star rating`}>
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className="review-star">★</span>
    ))}
  </div>
);

function ReviewCard({ review, index }) {
  return (
    <div
      className="review-card reveal"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Quote icon */}
      <div className="review-quote-icon" aria-hidden="true">"</div>

      {/* Stars */}
      <StarRating count={review.rating} />

      {/* Review text */}
      <p className="review-text">{review.text}</p>

      {/* Product badge */}
      <div className="review-product-badge">
        <span className="review-product-dot" style={{ background: review.color }} />
        {review.product}
      </div>

      {/* Reviewer info */}
      <div className="review-author">
        <div
          className="review-avatar"
          style={{ background: `linear-gradient(135deg, ${review.color}cc, ${review.color})` }}
          aria-hidden="true"
        >
          {review.initial}
        </div>
        <div className="review-author-info">
          <span className="review-author-name">{review.name}</span>
          <span className="review-author-location">📍 {review.location}</span>
        </div>
        <div className="review-verified" title="Verified Customer">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <circle cx="12" cy="12" r="10" fill="#4CAF50" />
            <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const trackRef = useRef(null);

  // Auto-scroll marquee for desktop
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let animFrame;
    let pos = 0;
    const speed = 0.4;

    const tick = () => {
      pos -= speed;
      const half = track.scrollWidth / 2;
      if (Math.abs(pos) >= half) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);

    // Pause on hover
    const pause = () => cancelAnimationFrame(animFrame);
    const resume = () => { animFrame = requestAnimationFrame(tick); };
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(animFrame);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
    };
  }, []);

  // Duplicate reviews for seamless loop
  const allReviews = [...REVIEWS, ...REVIEWS];

  return (
    <section className="reviews-section" id="reviews" aria-label="Customer Reviews">
      {/* Header */}
      <div className="reviews-header reveal">
        <span className="reviews-eyebrow">What Our Devotees Say</span>
        <h2 className="reviews-title">Loved by Our Community</h2>
        <div className="reviews-rating-row">
          <div className="reviews-rating-score">4.9</div>
          <div>
            <div className="reviews-rating-stars" aria-label="4.9 out of 5 stars">
              ★★★★★
            </div>
            <p className="reviews-rating-count">Based on 500+ happy customers</p>
          </div>
        </div>
      </div>

      {/* Scrolling marquee */}
      <div className="reviews-marquee-wrapper" aria-hidden="true">
        <div className="reviews-marquee-track" ref={trackRef}>
          {allReviews.map((review, i) => (
            <div className="reviews-marquee-card" key={i}>
              <StarRating count={review.rating} />
              <p className="review-text">{review.text}</p>
              <div className="review-author" style={{ marginTop: "16px" }}>
                <div
                  className="review-avatar"
                  style={{ background: `linear-gradient(135deg, ${review.color}cc, ${review.color})` }}
                >
                  {review.initial}
                </div>
                <div className="review-author-info">
                  <span className="review-author-name">{review.name}</span>
                  <span className="review-author-location">📍 {review.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of all reviews (visible below marquee on mobile or as fallback) */}
      <div className="reviews-grid-section">
        <div className="reviews-grid">
          {REVIEWS.map((review, i) => (
            <ReviewCard key={i} review={review} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
