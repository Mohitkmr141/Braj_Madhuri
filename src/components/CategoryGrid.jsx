import React from "react";
import "./CategoryGrid.css";

const allImages = import.meta.glob(
  "../assets/images/**/*.{png,jpg,jpeg,webp,svg}",
  { eager: true, import: "default" },
);

const CATEGORY_MAP = {};
Object.entries(allImages).forEach(([path, url]) => {
  const parts = path.split("/");
  const folderName = parts[parts.length - 2];
  if (!CATEGORY_MAP[folderName]) {
    CATEGORY_MAP[folderName] = url;
  }
});

const CATEGORIES = Object.entries(CATEGORY_MAP);
const formatFolderName = (name) => name.replaceAll("-", " ");

export default function CategoryGrid({ onExplore }) {
  return (
    <section className="category-section" aria-label="Product categories">
      <div className="section-header">
        <span className="section-eyebrow">Browse</span>
        <h2 className="section-title">Featured Categories</h2>
        <div className="section-divider" />
      </div>

      <div className="category-grid">
        {CATEGORIES.map(([folder, imgUrl]) => (
          <button
            key={folder}
            className="category-cell"
            onClick={() => onExplore?.(folder)}
          >
            <div className="category-img-wrapper">
              <img src={imgUrl} alt={formatFolderName(folder)} loading="lazy" />
            </div>
            <p className="category-name">{formatFolderName(folder)}</p>
          </button>
        ))}
      </div>

      <button className="explore-btn" onClick={() => onExplore?.()}>
        Explore Our Collection
      </button>
    </section>
  );
}
