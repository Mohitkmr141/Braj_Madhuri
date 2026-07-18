"use client";

import React, { useState } from "react";
import Image from "next/image";
import "./CategoryGrid.css";
import PRODUCT_IMAGE_MAP from "../data/productImages.js";
import CATEGORIES from "../data/categoriesData.js";

const THUMBNAIL_OVERRIDES = {
  "bhakti-combos": "/images/images/Bhakti Combos/Nitya Sewa Kit.jpeg"
};

/**
 * Build a lookup: categoryId → first representative image URL.
 * For each category we try each folderKey in order and use the
 * first image found.
 */
function buildThumbnailMap() {
  const map = {};
  CATEGORIES.forEach((cat) => {
    if (THUMBNAIL_OVERRIDES[cat.id]) {
      map[cat.id] = THUMBNAIL_OVERRIDES[cat.id];
      return;
    }
    for (const key of cat.folderKeys) {
      const images = PRODUCT_IMAGE_MAP[key];
      if (images && images.length > 0) {
        map[cat.id] = images[0].image;
        break;
      }
    }
  });
  return map;
}

const THUMBNAIL_MAP = buildThumbnailMap();

export default function CategoryGrid({ activeCategory, onExplore }) {
  const [openSubcat, setOpenSubcat] = useState(null);

  const handleCategoryClick = (cat) => {
    if (cat.subcategories.length > 0) {
      setOpenSubcat((prev) => (prev === cat.id ? null : cat.id));
    } else {
      onExplore?.(cat.id);
    }
  };

  const handleSubcategoryClick = (catId, sub, e) => {
    e.stopPropagation();
    onExplore?.(`${catId}::${sub}`);
    setOpenSubcat(null);
  };

  return (
    <section className="category-section" aria-label="Product categories">
      <div className="section-header">
        <h2 className="section-title">Shop By Category</h2>
        <div className="section-divider" />
      </div>

      <div className="category-grid">
        {CATEGORIES.map((cat) => {
          const imgSrc = THUMBNAIL_MAP[cat.id];
          const isActive = activeCategory === cat.id;
          const isOpen = openSubcat === cat.id;

          return (
            <div key={cat.id} className="category-cell-wrap">
              <button
                className={`category-cell${isActive ? " category-cell--active" : ""}`}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                aria-pressed={isActive}
                aria-haspopup={cat.subcategories.length > 0 ? "listbox" : undefined}
                aria-expanded={cat.subcategories.length > 0 ? isOpen : undefined}
              >
                {/* Circular image with golden ring */}
                <div className="category-img-wrapper">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={cat.label}
                      decoding="async"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <span className="category-emoji-fallback" aria-hidden="true">
                      
                    </span>
                  )}

                  {/* Chevron badge on top-right of circle */}
                  {cat.subcategories.length > 0 && (
                    <span
                      className={`category-chevron${isOpen ? " category-chevron--open" : ""}`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  )}
                </div>

                {/* Label below circle */}
                <p className="category-name">
                  {cat.label}
                </p>
              </button>

              {/* Subcategory dropdown */}
              {cat.subcategories.length > 0 && isOpen && (
                <ul
                  className="subcategory-list"
                  role="listbox"
                  aria-label={`${cat.label} subcategories`}
                >
                  {/* "All" option */}
                  <li>
                    <button
                      className="subcategory-item subcategory-item--all"
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        onExplore?.(cat.id);
                        setOpenSubcat(null);
                      }}
                    >
                      All {cat.label}
                    </button>
                  </li>
                  {cat.subcategories.map((sub) => (
                    <li key={sub}>
                      <button
                        className="subcategory-item"
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={(e) => handleSubcategoryClick(cat.id, sub, e)}
                      >
                        {sub}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="explore-btn"
        type="button"
        onClick={() => {
          setOpenSubcat(null);
          onExplore?.();
        }}
      >
        Explore Our Collection
      </button>
    </section>
  );
}
