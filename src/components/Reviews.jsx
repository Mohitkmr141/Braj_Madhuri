import React from "react";

const STAR_RATING = "\u2605\u2605\u2605\u2605\u2605";

// We can accept an array of Instagram post IDs
const INSTAGRAM_POSTS = [
  "DX2FinLiVQ0", // the one they provided
  "DX2FinLiVQ0", // placeholder for 2nd post
  "DX2FinLiVQ0", // placeholder for 3rd post
];

function Reviews() {
  return (
    <section className="reviews-section" id="reviews">
      <div className="rating-banner">
        <div className="rating-big">4.9</div>
        <div className="rating-stars-big" aria-label="5 star rating">
          {STAR_RATING}
        </div>
        <p className="rating-desc" style={{ fontSize: '1.2rem', marginTop: '8px' }}>
          Real Reviews from our Instagram Family
        </p>
      </div>

      <div 
        className="reviews-layout" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '32px', 
          maxWidth: '1200px',
          margin: '0 auto',
          alignItems: 'center'
        }}
      >
        {INSTAGRAM_POSTS.map((postId, index) => (
          <div className="instagram-embed" key={index} style={{ width: '100%', margin: '0' }}>
            <iframe
              src={`https://www.instagram.com/p/${postId}/embed`}
              width="100%"
              height="480"
              frameBorder="0"
              allow="encrypted-media"
              title={`Instagram Review ${index + 1}`}
              style={{
                background: "white",
                border: "1px solid #dbdbdb",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                display: "block",
                maxWidth: "100%",
                padding: "0",
                overflow: "hidden",
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default Reviews;
