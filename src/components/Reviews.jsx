import React from "react";

const STAR_RATING = "\u2605\u2605\u2605\u2605\u2605";

const reviews = [
  {
    text: "Very pure dhoop fragrance. It feels perfect for morning pooja.",
    name: "Radhika Sharma",
    location: "Mathura",
  },
  {
    text: "The poshak quality is beautiful and the colors look premium.",
    name: "Kunal Gupta",
    location: "Delhi",
  },
  {
    text: "Fast delivery and careful packing. Radhe Radhe.",
    name: "Meera Joshi",
    location: "Jaipur",
  },
];

function Reviews() {
  return (
    <section className="reviews-section" id="reviews">
      <div className="rating-banner">
        <div className="rating-big">4.9</div>
        <div className="rating-stars-big" aria-label="5 star rating">
          {STAR_RATING}
        </div>
        <p className="rating-desc">
          Loved by devotees for purity, packing, and fragrance.
        </p>
      </div>

      <div className="reviews-layout">
        <div className="instagram-embed">
          <iframe
            src="https://www.instagram.com/p/DX2FinLiVQ0/embed"
            width="400"
            height="480"
            frameBorder="0"
            allow="encrypted-media"
            title="Instagram Reviews"
            style={{
              background: "white",
              border: "1px solid #dbdbdb",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              display: "block",
              margin: "0 auto",
              maxWidth: "100%",
              minWidth: "326px",
              padding: "0",
              overflow: "hidden",
            }}
          />
        </div>

        <div className="reviews-grid">
          {reviews.map((review) => (
            <article className="review-card reveal" key={review.name}>
              <div className="review-quote">&quot;</div>
              <p className="review-text">{review.text}</p>
              <div className="review-author">
                <div className="review-avatar" aria-hidden="true">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <div className="review-name">{review.name}</div>
                  <div className="review-location">{review.location}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Reviews;
