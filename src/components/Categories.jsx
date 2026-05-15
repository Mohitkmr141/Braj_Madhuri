import React, { useState } from "react";
import "./CategoryGalleries.css";
import PRODUCT_DATA from "../data/productData.js";

const allImages = import.meta.glob(
  "../assets/images/**/*.{png,jpg,jpeg,webp,svg}",
  { eager: true, import: "default" },
);

const PRODUCT_MAP = {};

Object.entries(allImages).forEach(([path, url]) => {
  const parts = path.split("/");
  const folderName = parts[parts.length - 2];
  const rawName = parts[parts.length - 1].split(".")[0];

  if (!PRODUCT_MAP[folderName]) PRODUCT_MAP[folderName] = [];
  PRODUCT_MAP[folderName].push({ src: url, fileName: rawName });
});

const PRODUCTS = Object.keys(PRODUCT_MAP).sort();

export default function CategoryGalleries() {
  return (
    <div className="galleries-wrapper">
      {/* ✅ This grid wrapper was missing — cards were stacking full-width */}
      <div className="image-grid">
        {PRODUCTS.map((folderName) => (
          <ProductCard
            key={folderName}
            folderName={folderName}
            images={PRODUCT_MAP[folderName]}
            data={PRODUCT_DATA[folderName] ?? {}}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ folderName, images, data }) {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  const discount =
    data.originalPrice && data.price
      ? Math.round((1 - data.price / data.originalPrice) * 100)
      : null;

  return (
    <div className="image-card">
      <div className="image-card-img-wrapper">
        {discount && <span className="discount-badge">{discount}% OFF</span>}

        <img
          src={images[current].src}
          alt={data.description ?? folderName}
          loading="lazy"
        />

        {total > 1 && (
          <>
            <button
              className="slide-btn slide-btn--prev"
              onClick={prev}
              aria-label="Previous"
            >
              &#8249;
            </button>
            <button
              className="slide-btn slide-btn--next"
              onClick={next}
              aria-label="Next"
            >
              &#8250;
            </button>

            <div className="slide-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`slide-dot${i === current ? " slide-dot--active" : ""}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>

            <span className="slide-counter">
              {current + 1} / {total}
            </span>
          </>
        )}
      </div>

      <div className="image-card-info">
        <p className="item-description">{data.description ?? folderName}</p>
        <div className="item-pricing">
          {data.price !== undefined && (
            <span className="item-price">₹{data.price}.00</span>
          )}
          {data.originalPrice && (
            <span className="item-original-price">
              ₹{data.originalPrice}.00
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
