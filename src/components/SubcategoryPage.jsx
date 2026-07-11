"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import "./SubcategoryPage.css";
import PRODUCT_IMAGE_MAP from "../data/productImages.js";
import PRODUCT_DATA from "../data/productData.js";
import CATEGORIES from "../data/categoriesData.js";

// ── helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

/** Resolve which image-map folder keys to show for a given catId + subcategory name */
function resolveFolderKeys(catId, subName) {
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat) return [];
  const map = cat.subcategoryFolderMap ?? {};
  return map[subName] ?? cat.folderKeys ?? [];
}

/** Build flat list of { folderName, fileName, image, data } for a subcategory */
function buildProductList(catId, subName) {
  const folderKeys = resolveFolderKeys(catId, subName);
  const result = [];

  for (const key of folderKeys) {
    const images = PRODUCT_IMAGE_MAP[key];
    if (!images || images.length === 0) continue;
    const categoryData = PRODUCT_DATA[key] ?? {};

    for (const img of images) {
      const itemData = categoryData.items?.[img.fileName] ?? {};
      result.push({
        folderName: key,
        fileName: img.fileName,
        image: img.image,
        title: itemData.title ?? categoryData.title ?? img.fileName,
        description: itemData.description ?? categoryData.description ?? "",
        price: itemData.price ?? categoryData.price,
        originalPrice: itemData.originalPrice ?? categoryData.originalPrice,
        sizes: itemData.sizes ?? categoryData.sizes ?? null,
      });
    }
  }

  return result;
}

// ── Cart flash hook ──────────────────────────────────────────────────────────
function useCartFlash() {
  const [flashing, setFlashing] = useState(null);
  const flash = useCallback((id) => {
    setFlashing(id);
    setTimeout(() => setFlashing(null), 600);
  }, []);
  return [flashing, flash];
}

// ── ProductDetailCard ────────────────────────────────────────────────────────

function ProductDetailCard({ product, addToCart }) {
  const [selectedSize, setSelectedSize] = useState(
    product.sizes ? product.sizes[0] : null
  );
  const [flashing, flash] = useCartFlash();

  const discount =
    product.originalPrice && product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    addToCart?.(product.price ?? 250);
    flash("btn");
  };

  return (
    <article className="subcat-product-card reveal">
      {/* ── Image panel ─────────────────────────────────────── */}
      <div className="subcat-img-panel">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(max-width: 700px) 100vw, 340px"
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* ── Info panel ──────────────────────────────────────── */}
      <div className="subcat-info-panel">
        <h3 className="subcat-product-title">{product.title}</h3>

        {/* Pricing */}
        <div className="subcat-pricing">
          {product.price !== undefined && (
            <span className="subcat-price">{formatCurrency(product.price)}</span>
          )}
          {product.originalPrice && (
            <span className="subcat-original-price">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
          {discount && (
            <span className="subcat-save-badge">Save {discount}%</span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="subcat-description">{product.description}</p>
        )}

        {/* Sizes */}
        {product.sizes && product.sizes.length > 0 && (
          <>
            <p className="subcat-sizes-label">Available Sizes</p>
            <div className="subcat-sizes">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`subcat-size-btn${selectedSize === size ? " subcat-size-btn--active" : ""}`}
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selectedSize === size}
                >
                  {size}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Shipping badges */}
        <div className="subcat-badges">
          <span className="subcat-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Nationwide Shipping
          </span>
          <span className="subcat-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <path d="M16 8h4l3 5v4h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            Delivery: 7–10 days
          </span>
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          className={`subcat-atc-btn${flashing === "btn" ? " subcat-atc-btn--added" : ""}`}
          onClick={handleAddToCart}
          aria-label={`Add ${product.title} to cart`}
        >
          {flashing === "btn" ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Added!
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Add To Cart
            </>
          )}
        </button>
      </div>
    </article>
  );
}

// ── SubcategoryPage (main export) ────────────────────────────────────────────

export default function SubcategoryPage({
  catId,
  subName,
  catLabel,
  addToCart,
  onBack,
  onBackToCategory,
}) {
  const products = useMemo(
    () => buildProductList(catId, subName),
    [catId, subName]
  );

  return (
    <section className="subcat-page">
      {/* Breadcrumb */}
      <nav className="subcat-breadcrumb" aria-label="Breadcrumb">
        <button type="button" className="subcat-breadcrumb__link" onClick={onBack}>
          Home
        </button>
        <span className="subcat-breadcrumb__sep">›</span>
        <button type="button" className="subcat-breadcrumb__link" onClick={onBack}>
          Shop
        </button>
        <span className="subcat-breadcrumb__sep">›</span>
        <button
          type="button"
          className="subcat-breadcrumb__link"
          onClick={onBackToCategory}
        >
          {catLabel}
        </button>
        <span className="subcat-breadcrumb__sep">›</span>
        <span className="subcat-breadcrumb__current">{subName}</span>
      </nav>

      {/* Section header */}
      <div className="subcat-section-header">
        <span className="subcat-eyebrow">{catLabel}</span>
        <h2 className="subcat-section-title">{subName}</h2>
        <p className="subcat-section-subtitle">
          {products.length} product{products.length !== 1 ? "s" : ""} available
        </p>
        <div className="subcat-divider" />
      </div>

      {/* Product list */}
      {products.length > 0 ? (
        <div className="subcat-products-grid">
          {products.map((product) => (
            <ProductDetailCard
              key={`${product.folderName}__${product.fileName}`}
              product={product}
              addToCart={addToCart}
            />
          ))}
        </div>
      ) : (
        <div className="subcat-empty">
          <p className="subcat-empty__title">No products found for "{subName}"</p>
          <p>We're stocking up — check back soon!</p>
          <button
            type="button"
            className="subcat-empty__back"
            onClick={onBackToCategory}
          >
            ← Back to {catLabel}
          </button>
        </div>
      )}
    </section>
  );
}
