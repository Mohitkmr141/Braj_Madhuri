"use client";

import React from "react";
import Image from "next/image";
import "./CategoryGrid.css";
import PRODUCT_IMAGE_MAP from "../data/productImages.js";

const CATEGORY_MAP = {};
Object.entries(PRODUCT_IMAGE_MAP).forEach(([folderName, images]) => {
  if (!CATEGORY_MAP[folderName]) {
    CATEGORY_MAP[folderName] = images[0]?.image;
  }
});

const formatFolderName = (name) => name.replaceAll("-", " ");
const CATEGORIES = Object.entries(CATEGORY_MAP).sort(([left], [right]) =>
  formatFolderName(left).localeCompare(formatFolderName(right), "en", {
    numeric: true,
  }),
);

export default function CategoryGrid({ activeCategory, onExplore }) {
  return (
    <section className="category-section" aria-label="Product categories">
      <div className="section-header">
        
        <h2 className="section-title">Product Categories</h2>
        <div className="section-divider" />
      </div>

      <div className="category-grid">
        {CATEGORIES.map(([folder, imgUrl]) => (
          <button
            key={folder}
            className="category-cell"
            type="button"
            onClick={() => onExplore?.(folder)}
            aria-pressed={activeCategory === folder}
          >
            <div className="category-img-wrapper">
              <Image
                src={imgUrl}
                alt={formatFolderName(folder)}
                decoding="async"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />
            </div>
            <p className="category-name">{formatFolderName(folder)}</p>
          </button>
        ))}
      </div>

      <button
        className="explore-btn"
        type="button"
        onClick={() => onExplore?.()}
      >
        Explore Our Collection
      </button>
    </section>
  );
}
