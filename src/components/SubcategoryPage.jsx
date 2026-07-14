"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import "./SubcategoryPage.css";
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

/** Build list of matching products for a subcategory from the DB products array */
function resolveSubcategoryProducts(catId, subName, dbProducts) {
  const folderKeys = resolveFolderKeys(catId, subName);
  const keySet = new Set(folderKeys);
  return dbProducts.filter(p => keySet.has(p.folderName));
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
  const [isZoomed, setIsZoomed] = useState(false);

  const discount =
    product.originalPrice && product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    addToCart?.({
      id: product.id,
      title: product.title || product.folderName,
      image: product.imageUrl,
      price: product.price ?? 250,
      originalPrice: product.originalPrice,
      size: selectedSize
    });
    flash("btn");
  };

  const displayTitle = product.title || product.folderName;

  return (
    <article className="subcat-product-card reveal" onClick={() => setIsZoomed(true)} style={{ cursor: 'pointer' }}>
      {/* ── Image panel ─────────────────────────────────────── */}
      <div className="subcat-img-panel">
        <Image
          src={product.imageUrl}
          alt={displayTitle}
          fill
          sizes="(max-width: 700px) 100vw, 340px"
          style={{ objectFit: "cover" }}
        />
      </div>

      {isZoomed && typeof document !== "undefined" && createPortal(
        <div className="quick-view-overlay" onClick={() => setIsZoomed(false)}>
          <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
            <button className="quick-view-close" type="button" onClick={() => setIsZoomed(false)} aria-label="Close zoom">
              &times;
            </button>
            <div className="quick-view-image-panel">
              <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "300px" }}>
                <Image
                  src={product.imageUrl}
                  alt={displayTitle}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
            <div className="quick-view-info-panel">
              <h3 className="quick-view-title">{displayTitle}</h3>
              
              <div className="quick-view-price-row">
                {product.price !== undefined && (
                  <span className="quick-view-price">{formatCurrency(product.price)}</span>
                )}
                {product.originalPrice && (
                  <span className="quick-view-original-price">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
                {discount && (
                  <span className="quick-view-discount">{discount}% OFF</span>
                )}
              </div>

              <p className="quick-view-description">
                {product.description && <span>{product.description}</span>}
                {product.subheading && (
                  <span style={{ display: "block", marginTop: "4px", fontStyle: "italic", color: "#8a6b4e" }}>
                    {product.subheading}
                  </span>
                )}
                {!product.description && product.categoryDesc && <span>{product.categoryDesc}</span>}
              </p>

              {product.sizes && product.sizes.length > 0 && (
                <>
                  <p className="subcat-sizes-label" style={{ marginTop: 'auto' }}>Available Sizes</p>
                  <div className="subcat-sizes">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`subcat-size-btn${selectedSize === size ? " subcat-size-btn--active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                        aria-pressed={selectedSize === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                className="add-cart-btn gallery-cart-btn quick-view-atc"
                type="button"
                onClick={() => {
                  handleAddToCart();
                  setIsZoomed(false);
                }}
              >
                Add To Cart
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Info panel ──────────────────────────────────────── */}
      <div className="subcat-info-panel">
        <h3 className="subcat-product-title">{displayTitle}</h3>

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
        {(product.description || product.subheading || product.categoryDesc) && (
          <p className="subcat-description">
            {product.description && <span>{product.description}</span>}
            {product.subheading && (
              <span style={{ display: "block", marginTop: "4px", fontStyle: "italic", color: "#8a6b4e" }}>
                {product.subheading}
              </span>
            )}
            {!product.description && product.categoryDesc && <span>{product.categoryDesc}</span>}
          </p>
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

        {/* Shipping badges removed */}

        {/* Add to Cart */}
        <button
          type="button"
          className={`subcat-atc-btn${flashing === "btn" ? " subcat-atc-btn--added" : ""}`}
          onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
          aria-label={`Add ${displayTitle} to cart`}
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
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.categories) {
          // Flatten categories to products
          const flatProducts = data.categories.flatMap(c => 
            c.products.map(p => ({
              ...p,
              categoryTitle: c.title,
              categoryDesc: c.description,
              sizes: c.sizes && c.sizes.length > 0 ? c.sizes : null
            }))
          );
          setDbProducts(flatProducts);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const products = useMemo(
    () => resolveSubcategoryProducts(catId, subName, dbProducts),
    [catId, subName, dbProducts]
  );

  if (loading) {
    return <section className="subcat-page"><div className="subcat-section-header"><h2 className="subcat-section-title">Loading...</h2></div></section>;
  }

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
              key={product.id}
              product={product}
              addToCart={addToCart}
            />
          ))}
        </div>
      ) : (
        <div className="subcat-empty">
          <p className="subcat-empty__title">No products found for &quot;{subName}&quot;</p>
          <p>We&apos;re stocking up — check back soon!</p>
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
