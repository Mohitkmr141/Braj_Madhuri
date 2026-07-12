"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import "./CategoryGalleries.css";
import PRODUCT_DATA from "../data/productData.js";
import PRODUCT_IMAGE_MAP from "../data/productImages.js";
import CATEGORIES from "../data/categoriesData.js";

const PRODUCT_MAP = {};
Object.entries(PRODUCT_IMAGE_MAP).forEach(([folderName, images]) => {
  if (!PRODUCT_MAP[folderName]) PRODUCT_MAP[folderName] = [];
  PRODUCT_MAP[folderName].push(...images);
});

/**
 * Build a mapping: categoryId → array of [folderName, images] tuples.
 * Also resolves the display label for a category id.
 */
const CATEGORY_FOLDER_MAP = {};
const CATEGORY_LABEL_MAP = {};
CATEGORIES.forEach((cat) => {
  CATEGORY_LABEL_MAP[cat.id] = cat.label;

  // Register top-level folderKeys
  cat.folderKeys.forEach((key) => {
    if (PRODUCT_MAP[key]) {
      if (!CATEGORY_FOLDER_MAP[cat.id]) CATEGORY_FOLDER_MAP[cat.id] = new Set();
      CATEGORY_FOLDER_MAP[cat.id].add(key);
    }
  });

  // Also register all keys from subcategoryFolderMap so they are resolvable
  if (cat.subcategoryFolderMap) {
    Object.values(cat.subcategoryFolderMap).forEach((keys) => {
      keys.forEach((key) => {
        if (PRODUCT_MAP[key]) {
          if (!CATEGORY_FOLDER_MAP[cat.id]) CATEGORY_FOLDER_MAP[cat.id] = new Set();
          CATEGORY_FOLDER_MAP[cat.id].add(key);
        }
      });
    });
  }
});

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

// All products sorted alphabetically by folder name
const ALL_PRODUCTS = Object.entries(PRODUCT_MAP)
  .map(([folderName, images]) => [
    folderName,
    [...images].sort((a, b) =>
      a.fileName.localeCompare(b.fileName, "en", { numeric: true })
    ),
  ])
  .sort(([a], [b]) =>
    formatFolderName(a).localeCompare(formatFolderName(b), "en", { numeric: true })
  );

/**
 * Given a filterFolder value (which may be a category id like "dhoop-incense"
 * or a legacy folder name like "Aggarbaties", or a subcategory compound key
 * like "dhoop-incense::Dhoop Sticks"), return the list of [folderName, images]
 * tuples to display along with a human-readable title for the section.
 */
function resolveFilter(filterFolder, searchQuery = "") {
  let products = ALL_PRODUCTS;
  let title = "Devotional Essentials";
  let isAll = true;

  if (filterFolder) {
    // Subcategory compound key: "categoryId::SubcategoryName"
    if (filterFolder.includes("::")) {
      const [catId, subName] = filterFolder.split("::", 2);
      const catLabel = CATEGORY_LABEL_MAP[catId] ?? catId;
      const cat = CATEGORIES.find((c) => c.id === catId);
      const subFolderKeys = cat?.subcategoryFolderMap?.[subName] ?? (CATEGORY_FOLDER_MAP[catId] ? [...CATEGORY_FOLDER_MAP[catId]] : []);
      
      if (subFolderKeys.length > 0) {
        const keySet = new Set(subFolderKeys);
        products = ALL_PRODUCTS.filter(([fn]) => keySet.has(fn));
        title = `${catLabel} — ${subName}`;
        isAll = false;
      }
    }
    // New category id (e.g. "dhoop-incense")
    else if (CATEGORY_FOLDER_MAP[filterFolder]) {
      const folders = CATEGORY_FOLDER_MAP[filterFolder];
      products = ALL_PRODUCTS.filter(([fn]) => folders.has(fn));
      title = CATEGORY_LABEL_MAP[filterFolder] ?? filterFolder;
      isAll = false;
    }
    // Legacy: direct folder name match (e.g. "Aggarbaties")
    else {
      products = ALL_PRODUCTS.filter(([fn]) => fn === filterFolder);
      title = formatFolderName(filterFolder);
      isAll = false;
    }
  }

  if (searchQuery) {
    const query = searchQuery.trim().toLowerCase();
    
    // Filter products array, and inside each product, filter the images
    const filteredProducts = [];
    products.forEach(([folderName, images]) => {
      const folderData = PRODUCT_DATA[folderName] || {};
      
      const matchingImages = images.filter((img) => {
        const itemData = folderData.items?.[img.fileName] || {};
        const imgTitle = (itemData.title ?? folderData.title ?? formatFolderName(folderName)).toLowerCase();
        const imgDesc = (itemData.description ?? folderData.description ?? formatFolderName(folderName)).toLowerCase();
        
        return imgTitle.includes(query) || imgDesc.includes(query);
      });

      if (matchingImages.length > 0) {
        filteredProducts.push([folderName, matchingImages]);
      }
    });

    return {
      products: filteredProducts,
      title: filterFolder && !isAll ? title : `Search Results for "${searchQuery}"`,
      isAll: false,
    };
  }

  return { products, title, isAll };
}

export default function CategoryGalleries({
  filterFolder,
  searchQuery,
  addToCart,
  onClearFilter,
}) {
  const { products: visibleProducts, title, isAll } = useMemo(
    () => resolveFilter(filterFolder, searchQuery),
    [filterFolder, searchQuery]
  );

  return (
    <section className="galleries-wrapper" id="collections">
      <div className="section-header">
        <span className="section-eyebrow">
          {isAll ? "Shop By Collection" : "Selected Category"}
        </span>
        <h2 className="section-title">{title}</h2>
        <div className="section-divider" />
      </div>

      <div className="image-grid">
        {visibleProducts.length > 0 ? (
          visibleProducts.map(([folderName, images]) => (
            <ProductCard
              key={folderName}
              addToCart={addToCart}
              data={PRODUCT_DATA[folderName] ?? {}}
              folderName={folderName}
              images={images}
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

function ProductCard({ folderName, images, data, addToCart }) {
  const [current, setCurrent] = useState(0);
  const safeImages = images ?? [];
  const total = safeImages.length;
  const activeImage = safeImages[current] ?? safeImages[0];

  if (!activeImage) {
    return null;
  }

  const activeData = {
    ...data,
    ...(data.items?.[activeImage.fileName] ?? {}),
  };

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  const discount =
    activeData.originalPrice && activeData.price
      ? Math.round((1 - activeData.price / activeData.originalPrice) * 100)
      : null;

  return (
    <article className="image-card reveal">
      <div className="image-card-img-wrapper">
        {discount && <span className="discount-badge">{discount}% OFF</span>}

        <Image
          src={activeImage.image}
          alt={activeData.title ?? activeData.description ?? formatFolderName(folderName)}
          decoding="async"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
        />

        {total > 1 && (
          <>
            <button
              className="slide-btn slide-btn--prev"
              type="button"
              onClick={prev}
              aria-label="Previous image"
            >
              &#8249;
            </button>
            <button
              className="slide-btn slide-btn--next"
              type="button"
              onClick={next}
              aria-label="Next image"
            >
              &#8250;
            </button>

            <div className="slide-dots">
              {safeImages.map((image, i) => (
                <button
                  key={image.fileName}
                  className={`slide-dot${i === current ? " slide-dot--active" : ""}`}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Show image ${i + 1}`}
                />
              ))}
            </div>

            <span className="slide-counter">
              {current + 1} / {total}
            </span>
          </>
        )}
      </div>

      <div className="image-card-info">
        <h3 className="item-title">
          {activeData.title ?? formatFolderName(folderName)}
        </h3>
        <p className="item-description">
          {activeData.description ?? formatFolderName(folderName)}
        </p>
        <div className="item-pricing">
          {activeData.price !== undefined && (
            <span className="item-price">{formatCurrency(activeData.price)}</span>
          )}
          {activeData.originalPrice && (
            <span className="item-original-price">
              {formatCurrency(activeData.originalPrice)}
            </span>
          )}
        </div>
        <button
          className="add-cart-btn gallery-cart-btn"
          type="button"
          onClick={() => addToCart?.(activeData.price ?? 250)}
        >
          Add To Cart
        </button>
      </div>
    </article>
  );
}
