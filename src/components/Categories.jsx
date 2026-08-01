"use client";

import React, { useMemo, useState, useEffect } from "react";
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

  if (!isLoaded) {
    return <section className="galleries-wrapper" id="collections"><div className="section-header"><h2 className="section-title">Loading Products...</h2></div></section>;
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
        {visibleProducts.length > 0 ? (
          visibleProducts.map((product, index) => (
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
    </section>
  );
}

function ProductCard({ product, addToCart, autoOpen, priority = false }) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(autoOpen || false);
  const hasColors = Array.isArray(product?.colors) && product.colors.length > 0;
  const initialColor = hasColors ? product.colors[0] : "";
  const [selectedColor, setSelectedColor] = useState(initialColor);

  const hasSizes = typeof product?.size === 'string' && product.size.trim().length > 0;
  const parsedSizes = hasSizes ? product.size.split(',').map(s => s.trim()).filter(Boolean) : (product.sizes || []);
  const hasParsedSizes = parsedSizes.length > 0;
  const initialSize = hasParsedSizes ? parsedSizes[0] : (product.size || "");
  const [selectedSize, setSelectedSize] = useState(initialSize);

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const revealRef = useScrollReveal();

  const isFav = isInWishlist(product?.id, product?.size);

  // If the autoOpen prop changes (e.g. user navigates), update the state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpen) setIsQuickViewOpen(true);
  }, [autoOpen]);

  if (!product || !product.imageUrl) {
    return null;
  }

  const discount =
    product.originalPrice && product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const displayTitle = product.title || formatFolderName(product.folderName);
  const displayDesc = product.description || product.categoryDesc || formatFolderName(product.folderName);
  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    if (isFav) {
      removeFromWishlist(product.id, product.size);
    } else {
      addToWishlist({
        id: product.id,
        title: displayTitle,
        image: product.imageUrl,
        price: product.price ?? 250,
        originalPrice: product.originalPrice,
        size: hasParsedSizes ? selectedSize : product.size,
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
          src={product.imageUrl}
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
          {product.price !== null && (
            <span className="item-price">{formatCurrency(product.price)}</span>
          )}
          {product.originalPrice !== null && (
            <span className="item-original-price">
              {formatCurrency(product.originalPrice)}
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
              image: product.imageUrl,
              price: product.price ?? 250,
              originalPrice: product.originalPrice,
              size: hasParsedSizes ? selectedSize : product.size,
              color: hasColors ? selectedColor : undefined
            }); 
          }}
        >
          {isOutOfStock ? "Out of Stock" : "Add To Cart"}
        </button>
      </div>

      {isQuickViewOpen && typeof document !== "undefined" && createPortal(
        <div className="quick-view-overlay" onClick={() => setIsQuickViewOpen(false)}>
          <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
            <button className="quick-view-close" type="button" onClick={() => setIsQuickViewOpen(false)} aria-label="Close">
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
                {product.price !== null && (
                  <span className="quick-view-price">{formatCurrency(product.price)}</span>
                )}
                {product.originalPrice !== null && (
                  <span className="quick-view-original-price">
                    {formatCurrency(product.originalPrice)}
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
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  {hasColors && (
                    <div style={{ flex: 1 }}>
                      <label htmlFor={`color-select-${product.id}`} style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "600", textTransform: 'uppercase', letterSpacing: '0.05em', color: "var(--text-main)" }}>Color</label>
                      <select 
                        id={`color-select-${product.id}`} 
                        value={selectedColor} 
                        onChange={(e) => setSelectedColor(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "#fbfbfb", cursor: "pointer", fontSize: "13px", outline: "none" }}
                      >
                        {product.colors.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {hasParsedSizes && (
                    <div style={{ flex: 1 }}>
                      <label htmlFor={`size-select-${product.id}`} style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "600", textTransform: 'uppercase', letterSpacing: '0.05em', color: "var(--text-main)" }}>Size</label>
                      <select 
                        id={`size-select-${product.id}`} 
                        value={selectedSize} 
                        onChange={(e) => setSelectedSize(e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-light)", background: "#fbfbfb", cursor: "pointer", fontSize: "13px", outline: "none" }}
                      >
                        {parsedSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
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
                      image: product.imageUrl,
                      price: product.price ?? 250,
                      originalPrice: product.originalPrice,
                      size: hasParsedSizes ? selectedSize : product.size,
                      color: hasColors ? selectedColor : undefined
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
