"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import "./CategoryGalleries.css";
import CATEGORIES from "../data/categoriesData.js";
import { useWishlist } from "../context/WishlistContext.jsx";

const formatFolderName = (name) => {
  const parts = name.split("/");
  return parts[parts.length - 1].replaceAll("-", " ");
};
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

/**
 * Build a mapping: categoryId → array of folderKeys
 * Also resolves the display label for a category id.
 */
const CATEGORY_FOLDER_MAP = {};
const CATEGORY_LABEL_MAP = {};
CATEGORIES.forEach((cat) => {
  CATEGORY_LABEL_MAP[cat.id] = cat.label;

  // Register top-level folderKeys
  cat.folderKeys.forEach((key) => {
    if (!CATEGORY_FOLDER_MAP[cat.id]) CATEGORY_FOLDER_MAP[cat.id] = new Set();
    CATEGORY_FOLDER_MAP[cat.id].add(key);
  });

  // Also register all keys from subcategoryFolderMap so they are resolvable
  if (cat.subcategoryFolderMap) {
    Object.values(cat.subcategoryFolderMap).forEach((keys) => {
      keys.forEach((key) => {
        if (!CATEGORY_FOLDER_MAP[cat.id]) CATEGORY_FOLDER_MAP[cat.id] = new Set();
        CATEGORY_FOLDER_MAP[cat.id].add(key);
      });
    });
  }
});


/**
 * Given a filterFolder value, return the list of products to display.
 */
function resolveFilter(filterFolder, searchQuery, allProducts) {
  let products = allProducts;
  let title = "Devotional Essentials";
  let isAll = true;

  if (filterFolder) {
    // If it's a subcategory compound key: "categoryId::SubName"
    if (filterFolder.includes("::")) {
      const [catId, subName] = filterFolder.split("::", 2);
      const catLabel = CATEGORY_LABEL_MAP[catId] ?? catId;
      const cat = CATEGORIES.find((c) => c.id === catId);
      const subFolderKeys = cat?.subcategoryFolderMap?.[subName] ?? [];
      
      if (subFolderKeys.length > 0) {
        const keySet = new Set(subFolderKeys);
        products = allProducts.filter(p => keySet.has(p.folderName));
        title = `${catLabel} — ${subName}`;
        isAll = false;
      }
    } else {
      // It's a top-level category id
      const folders = CATEGORY_FOLDER_MAP[filterFolder] || new Set([filterFolder]);
      products = allProducts.filter(p => folders.has(p.folderName));
      title = CATEGORY_LABEL_MAP[filterFolder] ?? filterFolder;
      isAll = false;
    }
  }

  if (searchQuery) {
    const query = searchQuery.trim().toLowerCase();
    
    products = products.filter(p => {
      const imgTitle = (p.title || p.folderName).toLowerCase();
      const imgDesc = (p.description || "").toLowerCase();
      return imgTitle.includes(query) || imgDesc.includes(query);
    });

    return {
      products,
      title: filterFolder && !isAll ? title : `Search Results for "${searchQuery}"`,
      isAll: false,
    };
  }

  return { products, title, isAll };
}

export default function CategoryGalleries({
  filterFolder,
  searchQuery,
  activeProductId,
  addToCart,
  onClearFilter,
  dbProducts = [],
  productsLoading = false,
}) {
  const { products: visibleProducts, title, isAll } = useMemo(
    () => resolveFilter(filterFolder, searchQuery, dbProducts),
    [filterFolder, searchQuery, dbProducts]
  );

  if (productsLoading) {
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
      </div>

      <div className="image-grid">
        {visibleProducts.length > 0 ? (
          visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              addToCart={addToCart}
              product={product}
              autoOpen={product.id === activeProductId}
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

function ProductCard({ product, addToCart, autoOpen }) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(autoOpen || false);
  const [selectedColor, setSelectedColor] = useState("Pink");
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

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
        size: product.size,
        color: displayTitle.includes("Meenakari Chandrika Chokar") ? selectedColor : undefined
      });
    }
  };

  return (
    <article className="image-card reveal" onClick={() => setIsQuickViewOpen(true)} style={{ cursor: 'pointer' }}>
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
              size: product.size,
              color: displayTitle.includes("Meenakari Chandrika Chokar") ? selectedColor : undefined
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

              <p className="quick-view-description">
                {displayDesc}
              </p>

              {displayTitle.includes("Meenakari Chandrika Chokar") && (
                <div style={{ marginBottom: "15px" }}>
                  <label htmlFor="color-select" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Select Color:</label>
                  <select 
                    id="color-select" 
                    value={selectedColor} 
                    onChange={(e) => setSelectedColor(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                  >
                    <option value="Pink">Pink</option>
                    <option value="Blue">Blue</option>
                    <option value="Magenta">Magenta</option>
                  </select>
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
                      size: product.size,
                      color: displayTitle.includes("Meenakari Chandrika Chokar") ? selectedColor : undefined
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
