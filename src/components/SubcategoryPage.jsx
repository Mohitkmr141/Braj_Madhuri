"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import "./SubcategoryPage.css";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useProducts } from "../context/ProductsContext.jsx";
import { sortProducts } from "../utils/productHelpers.js";
import { useScrollReveal } from "../hooks/useScrollReveal.jsx";

// ── helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

/** Build list of matching products for a subcategory from the DB products array */
function resolveSubcategoryProducts(catId, subName, dbProducts) {
  return dbProducts.filter(p => {
    return p.categoryId === catId && (
      (p.subcategory && p.subcategory.title === subName) ||
      (p.folderName && p.folderName.split('/').pop() === subName)
    );
  });
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

function ProductDetailCard({ product, addToCart, priority = false }) {
  const displayTitle = product.title || "";
  
  const hasSizes = typeof product?.size === 'string' && product.size.trim().length > 0;
  const parsedSizes = hasSizes ? product.size.split(',').map(s => s.trim()).filter(Boolean) : (product.sizes || []);
  const hasParsedSizes = parsedSizes.length > 0;
  const initialSize = hasParsedSizes ? parsedSizes[0] : (product.size || "");
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [flashing, flash] = useCartFlash();
  const [isZoomed, setIsZoomed] = useState(false);
  const hasColors = Array.isArray(product?.colors) && product.colors.length > 0;
  const initialColor = hasColors ? product.colors[0] : "";
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const revealRef = useScrollReveal();

  const isFav = isInWishlist(product.id, selectedSize);

  const discount =
    product.originalPrice && product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: displayTitle,
      image: product.imageUrl,
      price: product.price ?? 250,
      originalPrice: product.originalPrice,
      size: hasParsedSizes ? selectedSize : product.size,
      color: hasColors ? selectedColor : undefined
    });
    flash("btn");
  };

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    if (isFav) {
      removeFromWishlist(product.id, selectedSize);
    } else {
      addToWishlist({
        id: product.id,
        title: displayTitle,
        image: product.imageUrl,
        price: product.price ?? 250,
        originalPrice: product.originalPrice,
        size: selectedSize,
        color: hasColors ? selectedColor : undefined
      });
    }
  };

  return (
    <article ref={revealRef} className="subcat-product-card reveal" onClick={() => setIsZoomed(true)} style={{ cursor: 'pointer' }}>
      {/* ── Image panel ─────────────────────────────────────── */}
      <div className="subcat-img-panel">
        <Image
          src={product.imageUrl}
          alt={displayTitle}
          decoding="async"
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: "cover", opacity: product.stock === 0 ? 0.5 : 1 }}
        />
        {product.stock === 0 && (
          <div className="stock-badge stock-badge--soldout">Sold Out</div>
        )}
        {product.stock > 0 && product.stock <= 3 && (
          <div className="stock-badge stock-badge--low">Only {product.stock} Left!</div>
        )}
        <button 
          className={`wishlist-toggle-btn ${isFav ? 'active' : ''}`}
          onClick={handleToggleWishlist}
          aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg viewBox="0 0 24 24" fill={isFav ? "var(--maroon)" : "none"} stroke={isFav ? "var(--maroon)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
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
              {product.subheading && (
                <div style={{ marginTop: "-8px", marginBottom: "16px", color: "var(--text-muted)", fontSize: "15px", fontWeight: "500", fontFamily: "var(--font-sans, 'Inter', sans-serif)" }}>
                  {product.subheading}
                </div>
              )}
              
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
                {!product.description && product.categoryDesc && <span>{product.categoryDesc}</span>}
              </p>

              {hasParsedSizes && (
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor={`size-select-zoom-${product.id}`} style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Select Size:</label>
                  <select 
                    id={`size-select-zoom-${product.id}`}
                    value={selectedSize} 
                    onChange={(e) => setSelectedSize(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                  >
                    {parsedSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasColors && (
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor={`color-select-zoom-${product.id}`} style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Select Color:</label>
                  <select 
                    id={`color-select-zoom-${product.id}`}
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                  >
                    {product.colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="add-cart-btn gallery-cart-btn quick-view-atc"
                  type="button"
                  disabled={product.stock === 0}
                  onClick={() => {
                    handleAddToCart();
                    setIsZoomed(false);
                  }}
                  style={{ flex: 1, opacity: product.stock === 0 ? 0.5 : 1, cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}
                >
                  {product.stock === 0 ? 'Sold Out' : 'Add To Cart'}
                </button>
                <button 
                  className={`wishlist-quick-btn ${isFav ? 'active' : ''}`}
                  onClick={handleToggleWishlist}
                  aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '46px', borderRadius: '4px', border: `1px solid ${isFav ? 'var(--maroon)' : '#ccc'}`,
                    background: isFav ? 'var(--maroon)' : '#fff', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg viewBox="0 0 24 24" fill={isFav ? "#fff" : "none"} stroke={isFav ? "#fff" : "#333"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Info panel ──────────────────────────────────────── */}
      <div className="subcat-info-panel">
        <h3 className="subcat-product-title">{displayTitle}</h3>
        {product.subheading && (
          <div style={{ marginTop: "-4px", marginBottom: "12px", color: "var(--text-muted)", fontSize: "14px", fontWeight: "500", fontFamily: "var(--font-sans, 'Inter', sans-serif)" }}>
            {product.subheading}
          </div>
        )}

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
        {(product.description || product.categoryDesc) && (
          <p className="subcat-description" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.description && <span>{product.description}</span>}
            {!product.description && product.categoryDesc && <span>{product.categoryDesc}</span>}
          </p>
        )}

        {/* Options Row */}
        {(hasColors || hasParsedSizes) && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', marginBottom: '4px' }}>
            {hasColors && (
              <div style={{ flex: 1, position: 'relative' }}>
                <label htmlFor={`color-select-${product.id}`} style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: '#777', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Color</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    id={`color-select-${product.id}`}
                    value={selectedColor} 
                    onChange={(e) => { e.stopPropagation(); setSelectedColor(e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ appearance: 'none', WebkitAppearance: 'none', width: '100%', padding: '8px 28px 8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#111827', outline: 'none', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                    onMouseOver={(e) => e.target.style.borderColor = '#d1d5db'}
                    onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    {product.colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                  <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            )}

            {hasParsedSizes && (
              <div style={{ flex: 1, position: 'relative' }}>
                <label htmlFor={`size-select-card-${product.id}`} style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: '#777', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Size</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    id={`size-select-card-${product.id}`}
                    value={selectedSize} 
                    onChange={(e) => { e.stopPropagation(); setSelectedSize(e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ appearance: 'none', WebkitAppearance: 'none', width: '100%', padding: '8px 28px 8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#111827', outline: 'none', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                    onMouseOver={(e) => e.target.style.borderColor = '#d1d5db'}
                    onMouseOut={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    {parsedSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add to Cart */}
        <button
          type="button"
          className={`subcat-atc-btn${flashing === "btn" ? " subcat-atc-btn--added" : ""}${product.stock === 0 ? " subcat-atc-btn--disabled" : ""}`}
          onClick={(e) => { e.stopPropagation(); if (product.stock > 0) handleAddToCart(); }}
          disabled={product.stock === 0}
          aria-label={product.stock === 0 ? `${displayTitle} is sold out` : `Add ${displayTitle} to cart`}
        >
          {product.stock === 0 ? (
            <>Sold Out</>
          ) : flashing === "btn" ? (
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
  const { categories, isLoaded } = useProducts();
  const [sortOrder, setSortOrder] = useState("low-to-high");
  
  const dbCat = categories?.find(c => c.id === catId);
  const resolvedCatLabel = dbCat?.title || catLabel;
  
  const dbProducts = useMemo(() => {
    if (!categories) return [];

    return categories.flatMap(c => 
      c.products.map(p => ({
        ...p,
        categoryId: c.id,
        categoryTitle: c.title,
        categoryDesc: c.description,
        sizes: c.sizes && c.sizes.length > 0 ? c.sizes : null
      }))
    );
  }, [categories, catId, resolvedCatLabel]);

  const products = useMemo(() => {
    const subcatProducts = resolveSubcategoryProducts(catId, subName, dbProducts);
    return sortProducts(subcatProducts, sortOrder);
  }, [catId, subName, dbProducts, sortOrder]);

  if (!isLoaded) {
    return (
      <section className="subcat-page">
        <div className="subcat-section-header">
          <h2 className="subcat-section-title">Loading...</h2>
        </div>
        <div className="subcat-products-grid" style={{ marginTop: '32px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-image"></div>
              <div className="skeleton-text title"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-button skeleton"></div>
            </div>
          ))}
        </div>
      </section>
    );
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
          {resolvedCatLabel}
        </button>
        <span className="subcat-breadcrumb__sep">›</span>
        <span className="subcat-breadcrumb__current">{subName}</span>
      </nav>

      {/* Section header */}
      <div className="subcat-section-header">
        <span className="subcat-eyebrow">{resolvedCatLabel}</span>
        <h2 className="subcat-section-title">{subName}</h2>
        <p className="subcat-section-subtitle">
          {products.length} product{products.length !== 1 ? "s" : ""} available
        </p>
        <div className="subcat-divider" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
          <label htmlFor="price-sort-subcat" style={{ marginRight: '10px', alignSelf: 'center', fontWeight: 'bold' }}>Sort by Price:</label>
          <select 
            id="price-sort-subcat" 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
          >
            <option value="default">Default</option>
            <option value="low-to-high">Low to High</option>
            <option value="high-to-low">High to Low</option>
          </select>
        </div>
      </div>

      {/* Product list */}
      {products.length > 0 ? (
        <div className="subcat-products-grid">
          {products.map((product, index) => (
            <ProductDetailCard
              key={product.id}
              product={product}
              addToCart={addToCart}
              priority={index < 4}
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
            ← Back to {resolvedCatLabel}
          </button>
        </div>
      )}
    </section>
  );
}
