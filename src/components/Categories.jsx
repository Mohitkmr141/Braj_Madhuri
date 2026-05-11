
import React from "react";
import "./CategoryGalleries.css";
import PRODUCT_DATA from "../data/productData.js";

const allImages = import.meta.glob(
  "../assets/images/**/*.{png,jpg,jpeg,webp,svg}",
  { eager: true, import: "default" },
);

const IMAGE_MAP = {};
Object.entries(allImages).forEach(([path, url]) => {
  const parts = path.split("/");
  const folderName = parts[parts.length - 2];
  const fileName = parts[parts.length - 1].split(".")[0];

  if (!IMAGE_MAP[folderName]) IMAGE_MAP[folderName] = [];
  IMAGE_MAP[folderName].push({
    src: url,
    fileName,
    ...PRODUCT_DATA[fileName],
  });
});

const CATEGORIES = Object.keys(IMAGE_MAP).sort();

export default function CategoryGalleries() {
  return (
    <div className="galleries-wrapper">
      {CATEGORIES.map((folder) => (
        <CategoryGallery key={folder} folder={folder} />
      ))}
    </div>
  );
}

function CategoryGallery({ folder }) {
  const items = IMAGE_MAP[folder] || [];
  if (items.length === 0) return null;

  return (
    <section className="category-gallery" data-folder={folder}>
      <h2 className="category-title">
        <span>{folder}</span>
      </h2>
      <div className="image-grid">
        {items.map((item) => {
          const discount =
            item.originalPrice && item.price
              ? Math.round((1 - item.price / item.originalPrice) * 100)
              : null;

          return (
            <div key={item.src} className="image-card">
              <div className="image-card-img-wrapper">
                {discount && (
                  <span className="discount-badge">{discount}% OFF</span>
                )}
                <img
                  src={item.src}
                  alt={item.description ?? item.fileName}
                  loading="lazy"
                />
              </div>
              <div className="image-card-info">
                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}
                <div className="item-pricing">
                  {item.price !== undefined && (
                    <span className="item-price">₹{item.price}.00</span>
                  )}
                  {item.originalPrice && (
                    <span className="item-original-price">
                      ₹{item.originalPrice}.00
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}