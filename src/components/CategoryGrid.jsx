"use client";

import React, { useState } from "react";
import Image from "next/image";
import "./CategoryGrid.css";
import CATEGORIES from "../data/categoriesData.js";
import { useProducts } from "../context/ProductsContext.jsx";


export default function CategoryGrid({ activeCategory, onExplore }) {
  const [openSubcat, setOpenSubcat] = useState(null);
  const [categoriesList, setCategoriesList] = useState(CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false);

  const { categories, isLoaded: loadedFromContext } = useProducts();

  React.useEffect(() => {
    if (categories && categories.length > 0) {
      const merged = CATEGORIES.map(cat => {
        const dbCat = categories.find(c => c.id === cat.id);
        if (dbCat) {
          const dbSubtitles = dbCat.subcategories ? dbCat.subcategories.map(s => s.title) : [];
          const combinedSubcats = [...new Set([...cat.subcategories, ...dbSubtitles])];
          const thumb = dbCat.thumbnailUrl ||
            (dbCat.products && dbCat.products.length > 0 ? dbCat.products[0].imageUrl : null);
          return { ...cat, label: dbCat.title, subcategories: combinedSubcats, imageUrl: thumb };
        }
        return cat;
      });
      
      const newDbCats = categories
        .filter(c => !CATEGORIES.some(staticCat => staticCat.id === c.id))
        .map(c => ({
          id: c.id,
          label: c.title,
          emoji: "✨",
          subcategories: c.subcategories ? c.subcategories.map(s => s.title) : [],
          folderKeys: [],
          subcategoryFolderMap: {},
          imageUrl: c.products && c.products.length > 0 ? c.products[0].imageUrl : null
        }));

      setCategoriesList([...merged, ...newDbCats]);
      setIsLoaded(true);
    } else if (loadedFromContext) {
      // Data is loaded but empty
      setIsLoaded(true);
    }
  }, [categories, loadedFromContext]);

  const handleCategoryClick = (cat) => {
    const subcats = cat.subcategories || [];
    if (subcats.length > 0) {
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
        {categoriesList.map((cat, index) => {
          const imgSrc = cat.imageUrl;
          const isActive = activeCategory === cat.id;
          const isOpen = openSubcat === cat.id;
          const subcats = cat.subcategories || [];

          return (
            <div key={cat.id} className="category-cell-wrap">
              <button
                className={`category-cell${isActive ? " category-cell--active" : ""}`}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                aria-pressed={isActive}
                aria-haspopup={subcats.length > 0 ? "listbox" : undefined}
                aria-expanded={subcats.length > 0 ? isOpen : undefined}
              >
                {/* Circular image with golden ring */}
                <div className="category-img-wrapper">
                  {!isLoaded ? (
                    <div style={{ width: "100%", height: "100%", background: "#eee", borderRadius: "50%", animation: "pulse 1.5s infinite ease-in-out" }}></div>
                  ) : imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={cat.label}
                      decoding="async"
                      fill
                      priority={index < 4}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <span className="category-emoji-fallback" aria-hidden="true">
                      
                    </span>
                  )}

                  {/* Chevron badge on top-right of circle */}
                  {subcats.length > 0 && (
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
                  {cat.label || '\u00A0'}
                </p>
              </button>

              {/* Subcategory dropdown */}
              {subcats.length > 0 && isOpen && (
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
                  {subcats.map((sub) => (
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
