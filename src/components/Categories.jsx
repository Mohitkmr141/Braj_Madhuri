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
const formatFolderName = (name) => name.replaceAll("-", " ");

export default function CategoryGalleries({ filterFolder, addToCart }) {
  const visibleProducts = filterFolder
    ? PRODUCTS.filter((folderName) => folderName === filterFolder)
    : PRODUCTS;

  return (
    <section className="galleries-wrapper" id="collections">
      <div className="section-header">
        <span className="section-eyebrow">
          {filterFolder ? "Selected Category" : "Shop By Collection"}
        </span>
        <h2 className="section-title">
          {filterFolder ? formatFolderName(filterFolder) : "Devotional Essentials"}
        </h2>
        <div className="section-divider" />
      </div>

      <div className="image-grid">
        {visibleProducts.map((folderName) => (
          <ProductCard
            key={folderName}
            folderName={folderName}
            images={PRODUCT_MAP[folderName]}
            data={PRODUCT_DATA[folderName] ?? {}}
            addToCart={addToCart}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ folderName, images, data, addToCart }) {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  const discount =
    data.originalPrice && data.price
      ? Math.round((1 - data.price / data.originalPrice) * 100)
      : null;

  return (
    <article className="image-card reveal">
      <div className="image-card-img-wrapper">
        {discount && <span className="discount-badge">{discount}% OFF</span>}

        <img
          src={images[current].src}
          alt={data.description ?? formatFolderName(folderName)}
          loading="lazy"
        />

        {total > 1 && (
          <>
            <button
              className="slide-btn slide-btn--prev"
              onClick={prev}
              aria-label="Previous image"
            >
              &#8249;
            </button>
            <button
              className="slide-btn slide-btn--next"
              onClick={next}
              aria-label="Next image"
            >
              &#8250;
            </button>

            <div className="slide-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`slide-dot${i === current ? " slide-dot--active" : ""}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Show image ${i + 1}`}
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
        <p className="item-description">
          {data.description ?? formatFolderName(folderName)}
        </p>
        <div className="item-pricing">
          {data.price !== undefined && (
            <span className="item-price">INR {data.price}.00</span>
          )}
          {data.originalPrice && (
            <span className="item-original-price">
              INR {data.originalPrice}.00
            </span>
          )}
        </div>
        <button
          className="add-cart-btn gallery-cart-btn"
          onClick={() => addToCart?.(data.price ?? 250)}
        >
          Add To Cart
        </button>
      </div>
    </article>
  );
}
