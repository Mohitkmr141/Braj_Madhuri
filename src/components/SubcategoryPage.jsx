"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import "./SubcategoryPage.css";
import CATEGORIES from "../data/categoriesData.js";
import { useWishlist } from "../context/WishlistContext.jsx";

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
  return dbProducts.filter(p => {
    // Match by folder name (legacy mapping) OR by DB subcategory title with matching category
    const matchesFolder = keySet.has(p.folderName);
    const matchesDbSubcategory = p.categoryId === catId && p.subcategory && p.subcategory.title === subName;
    return matchesFolder || matchesDbSubcategory;
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

function ProductDetailCard({ product, addToCart }) {
  const displayTitle = product.title || product.folderName;
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [flashing, flash] = useCartFlash();
  const [isZoomed, setIsZoomed] = useState(false);
  const initialColor = (product?.title || product?.folderName || "").includes("Pearl Choker") ? "Green" : ((product?.title || product?.folderName || "").includes("Long Kundan Haar") ? "Yellow" : ((product?.title || product?.folderName || "").includes("Small Haar") ? "Green" : ((product?.title || product?.folderName || "").includes("Enamael Pendants") ? "Orange" : ((product?.title || product?.folderName || "").includes("Lotus Mala") ? "Red" : ((product?.title || product?.folderName || "").includes("Heavy Kundan Mala Haar") ? "Orange" : ((product?.title || product?.folderName || "") === "Kundan Haar" ? "Pink" : "Pink"))))));
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

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
      size: selectedSize,
      color: (displayTitle?.includes("Meenakari Chandrika Chokar") || displayTitle?.includes("Pearl Choker") || displayTitle?.includes("Heavy Kundan Mala Haar") || displayTitle === "Kundan Haar" || displayTitle?.includes("Lotus Mala") || displayTitle?.includes("Small Haar") || displayTitle?.includes("Enamael Pendants") || displayTitle?.includes("Long Kundan Haar")) ? selectedColor : undefined
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
        color: (displayTitle?.includes("Meenakari Chandrika Chokar") || displayTitle?.includes("Pearl Choker") || displayTitle?.includes("Heavy Kundan Mala Haar") || displayTitle === "Kundan Haar" || displayTitle?.includes("Lotus Mala") || displayTitle?.includes("Small Haar") || displayTitle?.includes("Enamael Pendants") || displayTitle?.includes("Long Kundan Haar")) ? selectedColor : undefined
      });
    }
  };

  return (
    <article className="subcat-product-card reveal" onClick={() => setIsZoomed(true)} style={{ cursor: 'pointer' }}>
      {/* ── Image panel ─────────────────────────────────────── */}
      <div className="subcat-img-panel">
        <Image
          src={product.imageUrl}
          alt={displayTitle}
          fill
          sizes="(max-width: 700px) 100vw, 340px"
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

              {(displayTitle?.includes("Meenakari Chandrika Chokar") || displayTitle?.includes("Pearl Choker") || displayTitle?.includes("Heavy Kundan Mala Haar") || displayTitle === "Kundan Haar" || displayTitle?.includes("Lotus Mala") || displayTitle?.includes("Small Haar") || displayTitle?.includes("Enamael Pendants") || displayTitle?.includes("Long Kundan Haar")) && (
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor={`color-select-zoom-${product.id}`} style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Select Color:</label>
                  <select 
                    id={`color-select-zoom-${product.id}`}
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                  >
                    {displayTitle?.includes("Pearl Choker") ? (
                      <>
                        <option value="Green">Green</option>
                        <option value="Peach">Peach</option>
                        <option value="Yellow">Yellow</option>
                      </>
                    ) : displayTitle?.includes("Long Kundan Haar") ? (
                      <>
                        <option value="Yellow">Yellow</option>
                        <option value="Pink">Pink</option>
                        <option value="Golden">Golden</option>
                      </>
                    ) : displayTitle?.includes("Small Haar") ? (
                      <>
                        <option value="Green">Green</option>
                        <option value="Pink">Pink</option>
                        <option value="Silver">Silver</option>
                      </>
                    ) : displayTitle?.includes("Enamael Pendants") ? (
                      <>
                        <option value="Orange">Orange</option>
                        <option value="Green">Green</option>
                        <option value="Red">Red</option>
                      </>
                    ) : displayTitle?.includes("Lotus Mala") ? (
                      <>
                        <option value="Red">Red</option>
                        <option value="Green">Green</option>
                      </>
                    ) : displayTitle?.includes("Heavy Kundan Mala Haar") ? (
                      <>
                        <option value="Orange">Orange</option>
                        <option value="Light Green">Light Green</option>
                      </>
                    ) : displayTitle === "Kundan Haar" ? (
                      <>
                        <option value="Pink">Pink</option>
                        <option value="Green">Green</option>
                        <option value="Turquoise">Turquoise</option>
                      </>
                    ) : (
                      <>
                        <option value="Pink">Pink</option>
                        <option value="Blue">Blue</option>
                        <option value="Magenta">Magenta</option>
                      </>
                    )}
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
          <p className="subcat-description">
            {product.description && <span>{product.description}</span>}
            {!product.description && product.categoryDesc && <span>{product.categoryDesc}</span>}
          </p>
        )}

        {(displayTitle?.includes("Meenakari Chandrika Chokar") || displayTitle?.includes("Pearl Choker") || displayTitle?.includes("Heavy Kundan Mala Haar") || displayTitle === "Kundan Haar" || displayTitle?.includes("Lotus Mala") || displayTitle?.includes("Small Haar") || displayTitle?.includes("Enamael Pendants") || displayTitle?.includes("Long Kundan Haar")) && (
          <div style={{ margin: "15px 0" }}>
            <label htmlFor={`color-select-${product.id}`} style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Select Color:</label>
            <select 
              id={`color-select-${product.id}`}
              value={selectedColor} 
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
            >
              {displayTitle?.includes("Pearl Choker") ? (
                <>
                  <option value="Green">Green</option>
                  <option value="Peach">Peach</option>
                  <option value="Yellow">Yellow</option>
                </>
              ) : displayTitle?.includes("Long Kundan Haar") ? (
                <>
                  <option value="Yellow">Yellow</option>
                  <option value="Pink">Pink</option>
                  <option value="Golden">Golden</option>
                </>
              ) : displayTitle?.includes("Small Haar") ? (
                <>
                  <option value="Green">Green</option>
                  <option value="Pink">Pink</option>
                  <option value="Silver">Silver</option>
                </>
              ) : displayTitle?.includes("Enamael Pendants") ? (
                <>
                  <option value="Orange">Orange</option>
                  <option value="Green">Green</option>
                  <option value="Red">Red</option>
                </>
              ) : displayTitle?.includes("Lotus Mala") ? (
                <>
                  <option value="Red">Red</option>
                  <option value="Green">Green</option>
                </>
              ) : displayTitle?.includes("Heavy Kundan Mala Haar") ? (
                <>
                  <option value="Orange">Orange</option>
                  <option value="Light Green">Light Green</option>
                </>
              ) : displayTitle === "Kundan Haar" ? (
                <>
                  <option value="Pink">Pink</option>
                  <option value="Green">Green</option>
                  <option value="Turquoise">Turquoise</option>
                </>
              ) : (
                <>
                  <option value="Pink">Pink</option>
                  <option value="Blue">Blue</option>
                  <option value="Magenta">Magenta</option>
                </>
              )}
            </select>
          </div>
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
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                  aria-pressed={selectedSize === size}
                >
                  {size}
                </button>
              ))}
            </div>
          </>
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
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("low-to-high");

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.categories) {
          // Flatten categories to products
          const flatProducts = data.categories.flatMap(c => 
            c.products.map(p => ({
              ...p,
              categoryId: c.id,
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

  const products = useMemo(() => {
    const subcatProducts = resolveSubcategoryProducts(catId, subName, dbProducts);
    
    // Sort products based on sortOrder
    if (sortOrder === "low-to-high") {
      subcatProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === "high-to-low") {
      subcatProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    
    return subcatProducts;
  }, [catId, subName, dbProducts, sortOrder]);

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
