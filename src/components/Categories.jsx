"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import "./CategoryGalleries.css";
import PRODUCT_DATA from "../data/productData.js";
import PRODUCT_IMAGE_MAP from "../data/productImages.js";

const PRODUCT_MAP = {};

Object.entries(PRODUCT_IMAGE_MAP).forEach(([folderName, images]) => {
  if (!PRODUCT_MAP[folderName]) PRODUCT_MAP[folderName] = [];
  PRODUCT_MAP[folderName].push(...images);
});

const formatFolderName = (name) => name.replaceAll("-", " ");
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

const PRODUCTS = Object.entries(PRODUCT_MAP)
  .map(([folderName, images]) => [
    folderName,
    [...images].sort((left, right) =>
      left.fileName.localeCompare(right.fileName, "en", { numeric: true }),
    ),
  ])
  .sort(([left], [right]) =>
    formatFolderName(left).localeCompare(formatFolderName(right), "en", {
      numeric: true,
    }),
  );

export default function CategoryGalleries({
  filterFolder,
  addToCart,
  onClearFilter,
}) {
  const visibleProducts = useMemo(
    () =>
      filterFolder
        ? PRODUCTS.filter(([folderName]) => folderName === filterFolder)
        : PRODUCTS,
    [filterFolder],
  );

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
        {visibleProducts.length > 0 ? (
          visibleProducts.map(([folderName, images]) => (
            <ProductCard
              key={folderName}
              addToCart={addToCart}
              data={PRODUCT_DATA[folderName] ?? {}}
              folderName={folderName}
              images={images}
            />
          ))
        ) : (
          <div className="empty-state">
            <p className="empty-state__title">No products found for this category.</p>
            <p className="empty-state__body">
              Try another collection to continue browsing the catalog.
            </p>
            <button
              className="explore-btn empty-state__button"
              type="button"
              onClick={onClearFilter}
            >
              View All Collections
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ folderName, images, data, addToCart }) {
  const [current, setCurrent] = useState(0);
  const safeImages = images ?? [];
  const total = safeImages.length;
  const activeImage = safeImages[current] ?? safeImages[0];

  if (!activeImage) {
    return null;
  }

  const activeData = {
    ...data,
    ...(data.items?.[activeImage.fileName] ?? {}),
  };

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  const discount =
    activeData.originalPrice && activeData.price
      ? Math.round((1 - activeData.price / activeData.originalPrice) * 100)
      : null;

  return (
    <article className="image-card reveal">
      <div className="image-card-img-wrapper">
        {discount && <span className="discount-badge">{discount}% OFF</span>}

        <Image
          src={activeImage.image}
          alt={activeData.title ?? activeData.description ?? formatFolderName(folderName)}
          decoding="async"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {total > 1 && (
          <>
            <button
              className="slide-btn slide-btn--prev"
              type="button"
              onClick={prev}
              aria-label="Previous image"
            >
              &#8249;
            </button>
            <button
              className="slide-btn slide-btn--next"
              type="button"
              onClick={next}
              aria-label="Next image"
            >
              &#8250;
            </button>

            <div className="slide-dots">
              {safeImages.map((image, i) => (
                <button
                  key={image.fileName}
                  className={`slide-dot${i === current ? " slide-dot--active" : ""}`}
                  type="button"
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
        <h3 className="item-title">
          {activeData.title ?? formatFolderName(folderName)}
        </h3>
        <p className="item-description">
          {activeData.description ?? formatFolderName(folderName)}
        </p>
        <div className="item-pricing">
          {activeData.price !== undefined && (
            <span className="item-price">{formatCurrency(activeData.price)}</span>
          )}
          {activeData.originalPrice && (
            <span className="item-original-price">
              {formatCurrency(activeData.originalPrice)}
            </span>
          )}
        </div>
        <button
          className="add-cart-btn gallery-cart-btn"
          type="button"
          onClick={() => addToCart?.(activeData.price ?? 250)}
        >
          Add To Cart
        </button>
      </div>
    </article>
  );
}
