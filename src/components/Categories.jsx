"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import "./CategoryGalleries.css";
import CATEGORIES from "../data/categoriesData.js";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useProducts } from "../context/ProductsContext.jsx";
import { resolveFilter, sortProducts, formatFolderName, formatCurrency } from "../utils/productHelpers.js";
import { useScrollReveal } from "../hooks/useScrollReveal.jsx";

export default function CategoryGalleries({
  filterFolder,
  searchQuery,
  activeProductId,
  addToCart,
  onClearFilter,
}) {
  const { categories, isLoaded } = useProducts();
  const [sortOrder, setSortOrder] = useState("low-to-high");
  const INITIAL_BATCH_SIZE = 16;
  const [displayLimit, setDisplayLimit] = useState(INITIAL_BATCH_SIZE);

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
  }, [categories]);

  const { products: visibleProducts, title, isAll } = useMemo(() => {
    const result = resolveFilter(filterFolder, searchQuery, dbProducts);
    result.products = sortProducts(result.products, sortOrder);
    return result;
  }, [filterFolder, searchQuery, dbProducts, sortOrder]);

  // Reset display limit when filter, search, or sort changes
  useEffect(() => {
    setDisplayLimit(INITIAL_BATCH_SIZE);
  }, [filterFolder, searchQuery, sortOrder]);

  const displayedProducts = useMemo(() => {
    return visibleProducts.slice(0, displayLimit);
  }, [visibleProducts, displayLimit]);

  if (!isLoaded) {
    return (
      <section className="galleries-wrapper" id="collections">
        <div className="section-header">
          <span className="section-eyebrow">The Braj Madhuri</span>
          <h2 className="section-title">Loading Collections...</h2>
        </div>
        <div className="image-grid" style={{ padding: '24px 0' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="skeleton-card" style={{ minHeight: '320px' }}>
              <div className="skeleton skeleton-image" style={{ height: '180px' }} />
              <div className="skeleton skeleton-text title" style={{ width: '80%', marginTop: '12px' }} />
              <div className="skeleton skeleton-text short" />
              <div className="skeleton skeleton-button" style={{ height: '40px', marginTop: 'auto' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="galleries-wrapper" id="collections">
      <div className="section-header">
        <span className="section-eyebrow">
          {isAll ? "Shop By Collection" : filterFolder ? "Selected Category" : "Search Results"}
        </span>
        <h2 className="section-title">{title}</h2>
        {searchQuery && (
          <button 
            type="button" 
            className="explore-btn" 
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
            onClick={onClearFilter}
          >
            Clear Search
          </button>
        )}
        <div className="section-divider" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
          <label htmlFor="price-sort" style={{ marginRight: '10px', alignSelf: 'center', fontWeight: 'bold' }}>Sort by Price:</label>
          <select 
            id="price-sort" 
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

      <div className="image-grid">
        {displayedProducts.length > 0 ? (
          displayedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              addToCart={addToCart}
              product={product}
              autoOpen={product.id === activeProductId}
              priority={index < 4}
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

      {visibleProducts.length > displayLimit && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            type="button"
            className="explore-btn"
            onClick={() => setDisplayLimit((prev) => prev + 16)}
            style={{ padding: "12px 32px", fontSize: "14px" }}
          >
            Load More Products ({visibleProducts.length - displayLimit} remaining)
          </button>
        </div>
      )}
    </section>
  );
}

function ProductCard({ product, addToCart, autoOpen, priority = false }) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(autoOpen || false);
  
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

  // Find the first in-stock variant if available
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

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const revealRef = useScrollReveal();

  useEffect(() => {
    if (defaultVariant) {
      if (defaultVariant.size) setSelectedSize(defaultVariant.size);
      if (defaultVariant.color) setSelectedColor(defaultVariant.color);
    } else {
      setSelectedSize(hasParsedSizes ? parsedSizes[0] : (product?.size || ""));
      setSelectedColor(hasColors ? parsedColors[0] : "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

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
    if (!Array.isArray(product?.variants) || product.variants.length === 0) return null;
    
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
    const exactMatch = matches.find(v => {
      const vS = v.size ? v.size.trim().toLowerCase() : '';
      const vC = v.color ? v.color.trim().toLowerCase() : '';
      return (vS === selS) && (vC === selC);
    });
    return exactMatch || matches[0];
  }, [product?.variants, selectedSize, selectedColor]);

  const displayPrice = useMemo(() => {
    if (activeVariant && activeVariant.price !== undefined && activeVariant.price !== null && activeVariant.price !== '') {
      const p = parseFloat(activeVariant.price);
      if (!isNaN(p)) return p;
    }
    const baseP = parseFloat(product?.price);
    return !isNaN(baseP) ? baseP : 0;
  }, [activeVariant, product?.price]);

  const displayOriginalPrice = useMemo(() => {
    if (activeVariant && activeVariant.originalPrice !== undefined && activeVariant.originalPrice !== null && activeVariant.originalPrice !== '') {
      const op = parseFloat(activeVariant.originalPrice);
      if (!isNaN(op)) return op;
    }
    if (product?.originalPrice !== undefined && product?.originalPrice !== null && product?.originalPrice !== '') {
      const baseOp = parseFloat(product.originalPrice);
      if (!isNaN(baseOp)) return baseOp;
    }
    return null;
  }, [activeVariant, product?.originalPrice]);

  const displayStock = useMemo(() => {
    if (activeVariant && activeVariant.stock !== undefined && activeVariant.stock !== null && activeVariant.stock !== '') {
      const st = parseInt(activeVariant.stock, 10);
      if (!isNaN(st)) return st;
    }
    const baseSt = parseInt(product?.stock, 10);
    return !isNaN(baseSt) ? baseSt : 0;
  }, [activeVariant, product?.stock]);

  const displayImage = useMemo(() => {
    if (activeVariant && activeVariant.image) {
      return activeVariant.image;
    }
    if (product?.imageUrl) {
      return product.imageUrl;
    }
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images[0];
    }
    return "/header-banner.jpg";
  }, [activeVariant, product?.imageUrl, product?.images]);

  const isFav = isInWishlist(product?.id, selectedSize, hasColors ? selectedColor : undefined);

  // If the autoOpen prop changes (e.g. user navigates), update the state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpen) setIsQuickViewOpen(true);
  }, [autoOpen]);

  // Lock background scroll when Quick View modal is open on mobile
  useEffect(() => {
    if (isQuickViewOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isQuickViewOpen]);

  if (!product) {
    return null;
  }

  const discount =
    displayOriginalPrice && displayPrice && displayOriginalPrice > displayPrice
      ? Math.round((1 - displayPrice / displayOriginalPrice) * 100)
      : null;

  const displayTitle = product.title || formatFolderName(product.folderName);
  const displayDesc = product.description || product.categoryDesc || formatFolderName(product.folderName);
  const isOutOfStock = displayStock <= 0;

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    if (isFav) {
      removeFromWishlist(product.id, selectedSize, hasColors ? selectedColor : undefined);
    } else {
      addToWishlist({
        id: product.id,
        title: displayTitle,
        image: displayImage,
        price: displayPrice,
        originalPrice: displayOriginalPrice,
        size: selectedSize,
        color: hasColors ? selectedColor : undefined
      });
    }
  };

  return (
    <article ref={revealRef} className="image-card reveal" onClick={() => setIsQuickViewOpen(true)} style={{ cursor: 'pointer' }}>
      <div className="image-card-img-wrapper">
        {isOutOfStock ? (
          <span className="discount-badge" style={{ background: '#d32f2f', color: '#fff' }}>OUT OF STOCK</span>
        ) : discount ? (
          <span className="discount-badge">{discount}% OFF</span>
        ) : null}

        <Image
          src={displayImage}
          alt={displayTitle}
          decoding="async"
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
        />
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

      <div className="image-card-info">
        <h3 className="item-title">
          {displayTitle}
        </h3>
        {product.subheading && (
          <div style={{ marginTop: "-2px", marginBottom: "8px", color: "var(--text-muted)", fontSize: "13px", fontWeight: "500", fontFamily: "var(--font-sans, 'Inter', sans-serif)" }}>
            {product.subheading}
          </div>
        )}
        <p className="item-description">
          {displayDesc}
        </p>
        <div className="item-pricing">
          <span className="item-price">{formatCurrency(displayPrice)}</span>
          {displayOriginalPrice !== null && (
            <span className="item-original-price">
              {formatCurrency(displayOriginalPrice)}
            </span>
          )}
        </div>
        <button
          className="add-cart-btn gallery-cart-btn"
          type="button"
          disabled={isOutOfStock}
          style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          onClick={(e) => { 
            e.stopPropagation();
            if (isOutOfStock) return;
            addToCart?.({
              id: product.id,
              title: displayTitle,
              image: displayImage,
              price: displayPrice,
              originalPrice: displayOriginalPrice,
              size: hasParsedSizes ? selectedSize : product.size,
              color: hasColors ? selectedColor : undefined,
              stock: displayStock,
              maxStock: displayStock,
            }); 
          }}
        >
          {isOutOfStock ? "Out of Stock" : "Add To Cart"}
        </button>
      </div>

      {isQuickViewOpen && typeof document !== "undefined" && createPortal(
        <div className="quick-view-overlay" onClick={() => setIsQuickViewOpen(false)} role="dialog" aria-modal="true">
          <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
            <button className="quick-view-close" type="button" onClick={() => setIsQuickViewOpen(false)} aria-label="Close">
              &times;
            </button>
            <div className="quick-view-image-panel">
              <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "300px" }}>
                <Image
                  src={displayImage}
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
                <span className="quick-view-price">{formatCurrency(displayPrice)}</span>
                {displayOriginalPrice !== null && (
                  <span className="quick-view-original-price">
                    {formatCurrency(displayOriginalPrice)}
                  </span>
                )}
                {isOutOfStock ? (
                  <span className="quick-view-discount" style={{ background: '#d32f2f', color: '#fff' }}>OUT OF STOCK</span>
                ) : discount ? (
                  <span className="quick-view-discount">{discount}% OFF</span>
                ) : null}
              </div>

              <p className="quick-view-description" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayDesc}
              </p>

              {(hasColors || hasParsedSizes) && (
                <div style={{ marginBottom: "16px" }}>
                  {hasParsedSizes && (
                    <div className="variant-select-section" style={{ marginBottom: "12px" }}>
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
                    <div className="variant-select-section">
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
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="add-cart-btn gallery-cart-btn quick-view-atc"
                  type="button"
                  disabled={isOutOfStock}
                  style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', flex: 1 } : { flex: 1 }}
                  onClick={() => {
                    if (isOutOfStock) return;
                    addToCart?.({
                      id: product.id,
                      title: displayTitle,
                      image: displayImage,
                      price: displayPrice,
                      originalPrice: displayOriginalPrice,
                      size: hasParsedSizes ? selectedSize : product.size,
                      color: hasColors ? selectedColor : undefined,
                      stock: displayStock,
                      maxStock: displayStock,
                    });
                    setIsQuickViewOpen(false);
                  }}
                >
                  {isOutOfStock ? "Out of Stock" : "Add To Cart"}
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
    </article>
  );
}
