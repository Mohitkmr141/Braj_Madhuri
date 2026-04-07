import React from "react";

const reviews = [
  {
    id: 1,
    stars: "★★★★★",
    text: "The Phool Bangla Attar is absolutely divine. It instantly transports me to Vrindavan. I apply it during my daily puja and the fragrance lasts for hours. Truly blessed!",
    name: "Preeti Sharma",
    location: "Delhi, India",
    avatar: "🙏",
  },
  {
    id: 2,
    stars: "★★★★★",
    text: "I ordered the Panchamrit Attar for my Laddu Gopal Ji's wastra sewa. The scent is incredibly pure and sweet — exactly as described. Fast delivery and beautiful packaging too!",
    name: "Sunita Agarwal",
    location: "Mathura, UP",
    avatar: "🌺",
  },
  {
    id: 3,
    stars: "★★★★★",
    text: "Nidhivan Attar is otherworldly. I was skeptical ordering online but the quality exceeded all expectations. The earthiness mixed with sweetness is exactly what Vrindavan smells like. Jai Shri Krishna!",
    name: "Rajesh Gupta",
    location: "Mumbai, Maharashtra",
    avatar: "🪷",
  },
];

const Reviews = () => {
  return (
    <section className="reviews-section">
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div className="section-header reveal">
          <span className="section-eyebrow">Testimonials</span>
          <h2 className="section-title">
            What Our <em>Devotees</em> Say
          </h2>
          <div className="section-divider"></div>
        </div>
        <div className="rating-banner reveal">
          <div className="rating-big">4.9</div>
          <div className="rating-stars-big">★★★★★</div>
          <div className="rating-desc">
            Rated by thousands of devotees across India on Google
          </div>
        </div>
        <div className="reviews-grid">
          {reviews.map((review) => (
            <div key={review.id} className="review-card reveal">
              <div className="review-quote">"</div>
              <div className="review-stars">{review.stars}</div>
              <div className="review-text">{review.text}</div>
              <div className="review-author">
                <div className="review-avatar">{review.avatar}</div>
                <div>
                  <div className="review-name">{review.name}</div>
                  <div className="review-location">{review.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a
            href="#"
            className="btn-outline"
            style={{
              color: "var(--maroon)",
              borderColor: "rgba(123,27,42,0.4)",
            }}
          >
            SEE ALL GOOGLE REVIEWS
          </a>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
