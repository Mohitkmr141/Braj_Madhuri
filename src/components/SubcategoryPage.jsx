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
  
  // Extract sizes from product.size or variants
  const parsedSizes = useMemo(() => {
    let list = typeof product?.size === 'string' && product.size.trim().length > 0 
      ? product.size.split(',').map(s => s.trim()).filter(Boolean) 
      : (product.sizes || []);
    if (list.length === 0 && Array.isArray(product?.variants)) {
      const vSizes = product.variants.map(v => v.size ? v.size.trim() : '').filter(Boolean);
      list = Array.from(new Set(vSizes));
    }
    return list;
  }, [product?.size, product?.sizes, product?.variants]);

  // Extract colors from product.colors or variants
  const parsedColors = useMemo(() => {
    let list = Array.isArray(product?.colors) && product.colors.length > 0 ? product.colors : [];
    if (list.length === 0 && Array.isArray(product?.variants)) {
      const vColors = product.variants.map(v => v.color ? v.color.trim() : '').filter(Boolean);
      list = Array.from(new Set(vColors));
    }
    return list;
  }, [product?.colors, product?.variants]);

  const hasParsedSizes = parsedSizes.length > 0;
  const hasColors = parsedColors.length > 0;

  // Find the first in-stock variant if variants exist
  const defaultVariant = useMemo(() => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      const inStock = product.variants.find(v => (parseInt(v.stock, 10) || 0) > 0);
      return inStock || product.variants[0];
    }
    return null;
  }, [product?.variants]);

  const [selectedSize, setSelectedSize] = useState(() => {
    if (defaultVariant?.size) return defaultVariant.size;
    return hasParsedSizes ? parsedSizes[0] : (product?.size || "");
  });

  const [selectedColor, setSelectedColor] = useState(() => {
    if (defaultVariant?.color) return defaultVariant.color;
    return hasColors ? parsedColors[0] : "";
  });

  const [flashing, flash] = useCartFlash();
  const [isZoomed, setIsZoomed] = useState(false);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const revealRef = useScrollReveal();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset selections when the product itself changes (e.g. navigating between categories)
  useEffect(() => {
    if (defaultVariant) {
      if (defaultVariant.size) setSelectedSize(defaultVariant.size);
      if (defaultVariant.color) setSelectedColor(defaultVariant.color);
    } else {
      setSelectedSize(hasParsedSizes ? parsedSizes[0] : (product?.size || ""));
      setSelectedColor(hasColors ? parsedColors[0] : "");
    }
    setCurrentImageIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const isFav = isInWishlist(product.id, selectedSize, hasColors ? selectedColor : undefined);

  // Real-time stock status for each size given selected color
  const getSizeStockInfo = useCallback((size) => {
    if (!Array.isArray(product?.variants) || product.variants.length === 0) {
      const baseSt = parseInt(product?.stock, 10) || 0;
      return { stock: baseSt, isSoldOut: baseSt <= 0, isLowStock: baseSt > 0 && baseSt <= 3 };
    }
    const sLow = (size || '').trim().toLowerCase();
    const cLow = (selectedColor || '').trim().toLowerCase();
    
    const match = product.variants.find(v => {
      const vS = (v.size || '').trim().toLowerCase();
      const vC = (v.color || '').trim().toLowerCase();
      return vS === sLow && (!cLow || !vC || vC === cLow);
    }) || product.variants.find(v => (v.size || '').trim().toLowerCase() === sLow);

    const st = match ? (parseInt(match.stock, 10) || 0) : (parseInt(product?.stock, 10) || 0);
    return { stock: st, isSoldOut: st <= 0, isLowStock: st > 0 && st <= 3 };
  }, [product?.variants, product?.stock, selectedColor]);

  // Real-time stock status for each color given selected size
  const getColorStockInfo = useCallback((color) => {
    if (!Array.isArray(product?.variants) || product.variants.length === 0) {
      const baseSt = parseInt(product?.stock, 10) || 0;
      return { stock: baseSt, isSoldOut: baseSt <= 0, isLowStock: baseSt > 0 && baseSt <= 3 };
    }
    const cLow = (color || '').trim().toLowerCase();
    const sLow = (selectedSize || '').trim().toLowerCase();

    const match = product.variants.find(v => {
      const vS = (v.size || '').trim().toLowerCase();
      const vC = (v.color || '').trim().toLowerCase();
      return vC === cLow && (!sLow || !vS || vS === sLow);
    }) || product.variants.find(v => (v.color || '').trim().toLowerCase() === cLow);

    const st = match ? (parseInt(match.stock, 10) || 0) : (parseInt(product?.stock, 10) || 0);
    return { stock: st, isSoldOut: st <= 0, isLowStock: st > 0 && st <= 3 };
  }, [product?.variants, product?.stock, selectedSize]);

  const activeVariant = useMemo(() => {
    if (!Array.isArray(product.variants) || product.variants.length === 0) return null;
    
    const selS = selectedSize ? selectedSize.trim().toLowerCase() : '';
    const selC = selectedColor ? selectedColor.trim().toLowerCase() : '';

    const matches = product.variants.filter(v => {
      const vS = v.size ? v.size.trim().toLowerCase() : '';
      const vC = v.color ? v.color.trim().toLowerCase() : '';
      const matchSize = !vS || (selS && vS === selS);
      const matchColor = !vC || (selC && vC === selC);
      return matchSize && matchColor;
    });

    if (matches.length === 0) return null;

    // Prefer exact match (both size and color match) over wildcard
    const exactMatch = matches.find(v => {
      const vS = v.size ? v.size.trim().toLowerCase() : '';
      const vC = v.color ? v.color.trim().toLowerCase() : '';
      return (vS === selS) && (vC === selC);
    });

    return exactMatch || matches[0];
  }, [product.variants, selectedSize, selectedColor]);

  const allImages = useMemo(() => {
    return Array.isArray(product.images) && product.images.length > 0 
      ? product.images 
      : (product.imageUrl ? [product.imageUrl] : []);
  }, [product.images, product.imageUrl]);

  const mainImage = useMemo(() => {
    if (activeVariant && activeVariant.image && activeVariant.image.trim() !== '') {
      return activeVariant.image;
    }
    return allImages[0] || '';
  }, [activeVariant, allImages]);

  // When active variant has a specific linked image, sync the slideshow to it
  useEffect(() => {
    if (activeVariant && activeVariant.image && activeVariant.image.trim() !== '') {
      const idx = allImages.indexOf(activeVariant.image);
      if (idx !== -1) {
        setCurrentImageIndex(idx);
      }
    } else {
      // No variant image: reset to first image
      setCurrentImageIndex(0);
    }
  }, [activeVariant, allImages]);

  // When the quick-view modal closes, reset the slideshow
  useEffect(() => {
    if (!isZoomed) {
      if (activeVariant && activeVariant.image && activeVariant.image.trim() !== '') {
        const idx = allImages.indexOf(activeVariant.image);
        setCurrentImageIndex(idx !== -1 ? idx : 0);
      } else {
        setCurrentImageIndex(0);
      }
    }
  }, [isZoomed, allImages, activeVariant]);

  // Safe numeric extraction
  const displayPrice = useMemo(() => {
    if (activeVariant && activeVariant.price !== undefined && activeVariant.price !== null && activeVariant.price !== '') {
      const p = parseFloat(activeVariant.price);
      if (!isNaN(p)) return p;
    }
    const baseP = parseFloat(product.price);
    return !isNaN(baseP) ? baseP : 0;
  }, [activeVariant, product.price]);

  const displayOriginalPrice = useMemo(() => {
    if (activeVariant && activeVariant.originalPrice !== undefined && activeVariant.originalPrice !== null && activeVariant.originalPrice !== '') {
      const op = parseFloat(activeVariant.originalPrice);
      if (!isNaN(op)) return op;
    }
    if (product.originalPrice !== undefined && product.originalPrice !== null && product.originalPrice !== '') {
      const baseOp = parseFloat(product.originalPrice);
      if (!isNaN(baseOp)) return baseOp;
    }
    return null;
  }, [activeVariant, product.originalPrice]);

  const displayStock = useMemo(() => {
    if (activeVariant && activeVariant.stock !== undefined && activeVariant.stock !== null && activeVariant.stock !== '') {
      const st = parseInt(activeVariant.stock, 10);
      if (!isNaN(st)) return st;
    }
    const baseSt = parseInt(product.stock, 10);
    return !isNaN(baseSt) ? baseSt : 0;
  }, [activeVariant, product.stock]);

  const discount =
    displayOriginalPrice && displayPrice && displayOriginalPrice > displayPrice
      ? Math.round((1 - displayPrice / displayOriginalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: displayTitle,
      image: mainImage,
      price: displayPrice,
      originalPrice: displayOriginalPrice,
      size: hasParsedSizes ? selectedSize : product.size,
      color: hasColors ? selectedColor : undefined,
      stock: displayStock,
      maxStock: displayStock,
    });
    flash("btn");
  };

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    if (isFav) {
      removeFromWishlist(product.id, selectedSize, hasColors ? selectedColor : undefined);
    } else {
      addToWishlist({
        id: product.id,
        title: displayTitle,
        image: mainImage,
        price: displayPrice,
        originalPrice: displayOriginalPrice,
        size: selectedSize,
        color: hasColors ? selectedColor : undefined
      });
    }
  };

  return (
    <article ref={revealRef} className="subcat-product-card reveal" onClick={() => setIsZoomed(true)} style={{ cursor: 'pointer' }}>
      {/* ── Image panel ─────────────────────────────────────── */}
      <div className="subcat-img-panel">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={displayTitle}
          decoding="async"
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: "cover", opacity: displayStock === 0 ? 0.5 : 1 }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#aaa' }}>No Image</span>
          </div>
        )}
        {displayStock === 0 && (
          <div className="stock-badge stock-badge--soldout">Sold Out</div>
        )}
        {displayStock > 0 && displayStock <= 3 && (
          <div className="stock-badge stock-badge--low">Only {displayStock} Left!</div>
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
            <div className="quick-view-image-panel" style={{ position: "relative" }}>
              <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "300px" }}>
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[currentImageIndex]}
                    alt={`${displayTitle} - Image ${currentImageIndex + 1}`}
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#aaa' }}>No Image</span>
                  </div>
                )}
              </div>
              
              {allImages.length > 1 && (
                <>
                  <button 
                    className="slideshow-nav-btn slideshow-prev" 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length); }}
                    aria-label="Previous image"
                  >
                    &#10094;
                  </button>
                  <button 
                    className="slideshow-nav-btn slideshow-next" 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % allImages.length); }}
                    aria-label="Next image"
                  >
                    &#10095;
                  </button>
                  <div className="slideshow-dots">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        className={`slideshow-dot ${idx === currentImageIndex ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="quick-view-info-panel">
              <h3 className="quick-view-title">{displayTitle}</h3>
              {product.subheading && (
                <div className="quick-view-subheading">
                  {product.subheading}
                </div>
              )}
              
              <div className="quick-view-price-row">
                <span className="quick-view-price">{formatCurrency(displayPrice)}</span>
                {displayOriginalPrice && (
                  <span className="quick-view-original-price">
                    {formatCurrency(displayOriginalPrice)}
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
                <div className="variant-select-section" style={{ marginBottom: "16px" }}>
                  <label className="variant-label">
                    Select Size: <span className="variant-label-val">{selectedSize || 'Standard'}</span>
                  </label>
                  <div className="variant-pill-grid">
                    {parsedSizes.map((size) => {
                      const { stock, isSoldOut, isLowStock } = getSizeStockInfo(size);
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          className={`variant-pill ${isSelected ? 'variant-pill--active' : ''} ${isSoldOut ? 'variant-pill--soldout' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSize(size);
                          }}
                          title={isSoldOut ? `${size} (Sold Out)` : isLowStock ? `${size} (Only ${stock} left)` : `${size} (In Stock)`}
                        >
                          <span className={isSoldOut && !isSelected ? 'variant-pill-text-strike' : ''}>{size}</span>
                          {isSoldOut && <span className="variant-pill-badge variant-pill-badge--soldout">Sold Out</span>}
                          {!isSoldOut && isLowStock && <span className="variant-pill-badge variant-pill-badge--low">{stock} left</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasColors && (
                <div className="variant-select-section" style={{ marginBottom: "16px" }}>
                  <label className="variant-label">
                    Select Color: <span className="variant-label-val">{selectedColor}</span>
                  </label>
                  <div className="variant-pill-grid">
                    {parsedColors.map((color) => {
                      const { stock, isSoldOut, isLowStock } = getColorStockInfo(color);
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          className={`variant-pill ${isSelected ? 'variant-pill--active' : ''} ${isSoldOut ? 'variant-pill--soldout' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedColor(color);
                          }}
                          title={isSoldOut ? `${color} (Sold Out)` : isLowStock ? `${color} (Only ${stock} left)` : `${color} (In Stock)`}
                        >
                          <span className={isSoldOut && !isSelected ? 'variant-pill-text-strike' : ''}>{color}</span>
                          {isSoldOut && <span className="variant-pill-badge variant-pill-badge--soldout">Sold Out</span>}
                          {!isSoldOut && isLowStock && <span className="variant-pill-badge variant-pill-badge--low">{stock} left</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="add-cart-btn gallery-cart-btn quick-view-atc"
                  type="button"
                  disabled={displayStock === 0}
                  onClick={() => {
                    handleAddToCart();
                    setIsZoomed(false);
                  }}
                  style={{ flex: 1, opacity: displayStock === 0 ? 0.5 : 1, cursor: displayStock === 0 ? 'not-allowed' : 'pointer' }}
                >
                  {displayStock === 0 ? 'Sold Out' : 'Add To Cart'}
                </button>
                <button 
                  className={`wishlist-quick-btn ${isFav ? 'active' : ''}`}
                  onClick={handleToggleWishlist}
                  aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <svg viewBox="0 0 24 24" fill={isFav ? "var(--maroon)" : "none"} stroke={isFav ? "var(--maroon)" : "#9a7c50"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
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
          <div className="subcat-subheading">
            {product.subheading}
          </div>
        )}

        {/* Pricing */}
        <div className="subcat-pricing">
          <span className="subcat-price">{formatCurrency(displayPrice)}</span>
          {displayOriginalPrice && (
            <span className="subcat-original-price">
              {formatCurrency(displayOriginalPrice)}
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
          <div style={{ marginTop: '12px', marginBottom: '8px' }}>
            {hasParsedSizes && (
              <div className="variant-select-section" style={{ marginTop: '6px' }}>
                <label className="variant-label">
                  Size: <span className="variant-label-val">{selectedSize || 'Standard'}</span>
                </label>
                <div className="variant-pill-grid">
                  {parsedSizes.map((size) => {
                    const { stock, isSoldOut, isLowStock } = getSizeStockInfo(size);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        className={`variant-pill ${isSelected ? 'variant-pill--active' : ''} ${isSoldOut ? 'variant-pill--soldout' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSize(size);
                        }}
                        title={isSoldOut ? `${size} (Sold Out)` : isLowStock ? `${size} (Only ${stock} left)` : `${size} (In Stock)`}
                      >
                        <span className={isSoldOut && !isSelected ? 'variant-pill-text-strike' : ''}>{size}</span>
                        {isSoldOut && <span className="variant-pill-badge variant-pill-badge--soldout">Sold Out</span>}
                        {!isSoldOut && isLowStock && <span className="variant-pill-badge variant-pill-badge--low">{stock} left</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasColors && (
              <div className="variant-select-section" style={{ marginTop: '8px' }}>
                <label className="variant-label">
                  Color: <span className="variant-label-val">{selectedColor}</span>
                </label>
                <div className="variant-pill-grid">
                  {parsedColors.map((color) => {
                    const { stock, isSoldOut, isLowStock } = getColorStockInfo(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`variant-pill ${isSelected ? 'variant-pill--active' : ''} ${isSoldOut ? 'variant-pill--soldout' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedColor(color);
                        }}
                        title={isSoldOut ? `${color} (Sold Out)` : isLowStock ? `${color} (Only ${stock} left)` : `${color} (In Stock)`}
                      >
                        <span className={isSoldOut && !isSelected ? 'variant-pill-text-strike' : ''}>{color}</span>
                        {isSoldOut && <span className="variant-pill-badge variant-pill-badge--soldout">Sold Out</span>}
                        {!isSoldOut && isLowStock && <span className="variant-pill-badge variant-pill-badge--low">{stock} left</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add to Cart */}
        <button
          type="button"
          className={`subcat-atc-btn${flashing === "btn" ? " subcat-atc-btn--added" : ""}${displayStock === 0 ? " subcat-atc-btn--disabled" : ""}`}
          onClick={(e) => { e.stopPropagation(); if (displayStock > 0) handleAddToCart(); }}
          disabled={displayStock === 0}
          aria-label={displayStock === 0 ? `${displayTitle} is sold out` : `Add ${displayTitle} to cart`}
        >
          {displayStock === 0 ? (
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
        <div className="sort-control-row">
          <label htmlFor="price-sort-subcat" className="sort-control-label">Sort by Price:</label>
          <select 
            id="price-sort-subcat" 
            className="sort-control-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
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
