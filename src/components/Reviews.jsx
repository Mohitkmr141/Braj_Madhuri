"use client";

import React, { useEffect, useRef } from "react";
import "./Reviews.css";

const REVIEWS = [
  {
    name: "Hema",
    initial: "H",
    location: "New Delhi",
    rating: 5,
    text: "I ordered 'Nitya Seva Kit' which make me so happy and satisfied that all the products are of good quality specially at such pocket friendly rate. Fregnance of each and every Itr are very soothing. Radhe Radhe 😊 🙏",
    product: "Nitya Seva Kit",
    color: "#C9972A",
  },
  {
    name: "Anisha Rawat",
    initial: "A",
    location: "New Delhi",
    rating: 5,
    text: "I am very happy to say that Our Thakur ji liked all your products very much and what can I say, the amount of praise I would get is enough for your service. 🧡🧡",
    product: "Verified Customer",
    color: "#4A1521",
  },
  {
    name: "Arpita",
    initial: "A",
    location: "Agartala",
    rating: 5,
    text: "Im happy to receive the product, fragrance is so soothing and quantity of Itra Khas was so good. Perfume is very good, I applied on Madav Ji — Room was getting good fragrance, feels so good. I'm happy a lot, thank you. Radhe Radhe 🙏",
    product: "Itra Khas",
    color: "#7B3F00",
  },
  {
    name: "Advocate Shivani",
    initial: "S",
    location: "Rampur, Uttar Pradesh",
    rating: 5,
    text: "Apke diye hue product bhut hi acche hain. Fragrance acchi lagi 😍",
    product: "Verified Customer",
    color: "#5B1A8A",
  },
  {
    name: "Monika",
    initial: "M",
    location: "New Delhi",
    rating: 5,
    text: "Received the product and I must say it is worth buying.",
    product: "Verified Customer",
    color: "#B5451B",
  },
  {
    name: "Mamta Prajapati",
    initial: "M",
    location: "Surat, Gujarat",
    rating: 5,
    text: "Maine mere Laddu Gopal ke liye jo bhi purchase kiya hai woh bahut safely idher aaya hai.. thank u so much, muje sabhi seva bahut pasand aai 😊 Radhe Radhe 🙏",
    product: "Verified Customer",
    color: "#1A6B3C",
  },
  {
    name: "Joshna Reddy",
    initial: "J",
    location: "Mumbai",
    rating: 5,
    text: "I am extremely happy with my purchase. The packaging was perfect — everything arrived safely, neatly packed, and in excellent condition. The seva kit was beautifully arranged and contained everything as expected. The itar was the highlight for me. Its fragrance is very soothing, pleasant, and long-lasting, making it perfect for Thakurji seva. The aroma feels pure and calming, creating a peaceful devotional atmosphere. Overall, the quality, presentation, and fragrance exceeded my expectations. Highly recommended for anyone looking for items for Thakurji seva. 🙏✨",
    product: "Seva Kit & Itar",
    color: "#0D47A1",
  },
  {
    name: "Ena Pathak",
    initial: "E",
    location: "Delhi",
    rating: 5,
    text: "I ordered few products from the wide variety of range offered. I loved each and every product especially the havan cups and agarbattis — I am impressed. Great quality, burns clean, perfect for everyday use. The soothing fragrance simply elevates the puja experience. Highly recommend.",
    product: "Havan Cups & Agarbatti",
    color: "#6A0572",
  },
  {
    name: "Sangeeta Nagpal",
    initial: "S",
    location: "Noida, Uttar Pradesh",
    rating: 5,
    text: "I am happy with the products purchased, really awesome and with good fragrance. Will be happy to purchase the other products too.",
    product: "Verified Customer",
    color: "#1B5E20",
  },
  {
    name: "Nimisha",
    initial: "N",
    location: "Noida, Uttar Pradesh",
    rating: 5,
    text: "Soothing fragrance and good quality chandan.. perfect for daily offering.. worth buying.",
    product: "Chandan",
    color: "#C9972A",
  },
  {
    name: "Alka Verma",
    initial: "A",
    location: "Faridabad, Haryana",
    rating: 5,
    text: "Itra ki mahak manabhavan hai. Laddu Gopal ke vastr naram mulayam hain. Sticks ki mahak bhi bheeni bheeni hai... kul milakar sabhi products bahut acche hain. Jai Shri Radhe 🙏",
    product: "Itra & Vastra",
    color: "#8B1A1A",
  },
  {
    name: "Surbhi Choudhary",
    initial: "S",
    location: "Greater Noida",
    rating: 5,
    text: "Nice collection of fragrances, I liked ❤️ them all.",
    product: "Fragrance Collection",
    color: "#C2185B",
  },
  {
    name: "Sapna",
    initial: "S",
    location: "Bhavnagar, Gujarat",
    rating: 5,
    text: "Bahot acha paking kar k bheja or sab product bahot acha he 😍 I m so happy.",
    product: "Verified Customer",
    color: "#00695C",
  },
  {
    name: "Surbhi",
    initial: "S",
    location: "Noida, Uttar Pradesh",
    rating: 5,
    text: "I bought camphor, kesar tilak and dhoop sticks.. they are 💯 pure and feels very calm and spiritual when I used for pooja. Love all the products.",
    product: "Camphor, Kesar Tilak & Dhoop",
    color: "#37474F",
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
    let half = (track.scrollWidth / 2) || 1000;

    const updateDimensions = () => {
      if (track) half = (track.scrollWidth / 2) || 1000;
    };

    window.addEventListener("resize", updateDimensions);

    const tick = () => {
      pos -= speed;
      if (Math.abs(pos) >= half) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);

    // Pause on hover
    const pause = () => cancelAnimationFrame(animFrame);
    const resume = () => { cancelAnimationFrame(animFrame); animFrame = requestAnimationFrame(tick); };
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", updateDimensions);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
    };
  }, []);

  // Duplicate reviews for seamless infinite loop
  const allReviews = [...REVIEWS, ...REVIEWS];

  return (
    <section
      className="reviews-section"
      id="reviews"
      aria-label="Customer Reviews"
    >
      {/* Header */}
      <div className="reviews-header reveal">
        <span className="reviews-eyebrow">What Our Devotees Say</span>
        <h2 className="reviews-title">Trusted by Devotees Across India</h2>
        <div className="reviews-rating-row">
          <span className="reviews-rating-score">4.9</span>
          <div>
            <div className="reviews-rating-stars">★★★★★</div>
            <p className="reviews-rating-count">Based on verified customer reviews</p>
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
                  style={{
                    background: `linear-gradient(135deg, ${review.color}cc, ${review.color})`,
                  }}
                >
                  {review.initial}
                </div>
                <div className="review-author-info">
                  <span className="review-author-name">{review.name}</span>
                  <span className="review-author-location">
                    📍 {review.location}
                  </span>
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
