import React from "react";
import "./CategoryGrid.css";

const allImages = import.meta.glob(
  "../assets/images/**/*.{png,jpg,jpeg,webp,svg}",
  { eager: true, import: "default" },
);

// Pick ONE representative image per folder (the first one)
const CATEGORY_MAP = {};
Object.entries(allImages).forEach(([path, url]) => {
  const parts = path.split("/");
  const folderName = parts[parts.length - 2];
  if (!CATEGORY_MAP[folderName]) {
    CATEGORY_MAP[folderName] = url; // only first image per folder
  }
});

const CATEGORIES = Object.entries(CATEGORY_MAP);

export default function CategoryGrid({ onExplore }) {
  return (
    <section className="category-section">
      <div className="category-grid">
        {CATEGORIES.map(([folder, imgUrl]) => (
          <div
            key={folder}
            className="category-cell"
            onClick={() => onExplore?.(folder)}
          >
            <div className="category-img-wrapper">
              <img src={imgUrl} alt={folder} loading="lazy" />
            </div>
            <p className="category-name">{folder}</p>
          </div>
        ))}
      </div>

      <button className="explore-btn" onClick={() => onExplore?.()}>
        EXPLORE OUR COLLECTION
      </button>
    </section>
  );
}
