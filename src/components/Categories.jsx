// // Assumes this file is at: src/components/CategoryGalleries.jsx
// // and images are at:        src/assets/images/...

// import React from "react";

// const agarbatties = import.meta.glob(
//   "../assets/images/Aggarbaties/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const categoriesImgs = import.meta.glob(
//   "../assets/images/Categories/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const floralScent = import.meta.glob(
//   "../assets/images/Floral-Scent/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const hawanCups = import.meta.glob(
//   "../assets/images/Hawan-Cups/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const incenseDhoop = import.meta.glob(
//   "../assets/images/Incense-Dhoop-Sticks/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const japaEssentials = import.meta.glob(
//   "../assets/images/Japa-Essentials/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const chandanTilak = import.meta.glob(
//   "../assets/images/Premium-Chandan-Tilak/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const shank = import.meta.glob(
//   "../assets/images/Shank-for-Thakur-ji-Snan/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const poshak = import.meta.glob(
//   "../assets/images/Thakur-ji-Poshak/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const shringar = import.meta.glob(
//   "../assets/images/Thakur-ji-Shriang/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const tulsiMala = import.meta.glob(
//   "../assets/images/Tulsi-Mala-Original/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const ubtan = import.meta.glob(
//   "../assets/images/Ubtan-for-Thakur-Ji/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );
// const vastra = import.meta.glob(
//   "../assets/images/Vastra/*.{png,jpg,jpeg,webp,svg}",
//   { eager: true, import: "default" },
// );

// const IMAGE_MAP = {
//   Aggarbaties: Object.values(agarbatties),
//   Categories: Object.values(categoriesImgs),
//   "Floral Scent": Object.values(floralScent),
//   "Hawan Cups": Object.values(hawanCups),
//   "Incense & Dhoop Sticks": Object.values(incenseDhoop),
//   "Japa Essentials": Object.values(japaEssentials),
//   "Premium Chandan Tilak": Object.values(chandanTilak),
//   "Shank for Thakur ji Snan": Object.values(shank),
//   "Thakur ji Poshak": Object.values(poshak),
//   "Thakur ji Shriang": Object.values(shringar),
//   "Tulsi Mala Original": Object.values(tulsiMala),
//   "Ubtan for Thakur Ji": Object.values(ubtan),
//   Vastra: Object.values(vastra),
// };

// const CATEGORIES = Object.keys(IMAGE_MAP);

// export default function CategoryGalleries() {
//   return (
//     <>
//       {CATEGORIES.map((folder) => (
//         <CategoryGallery key={folder} folder={folder} />
//       ))}
//     </>
//   );
// }

// export function CategoryGallery({ folder }) {
//   const imageUrls = IMAGE_MAP[folder] || [];
//   if (imageUrls.length === 0) return null;

//   const folderImages = imageUrls.map((url) => ({
//     src: url,
//     alt: url.split("/").pop()?.split(".")[0] ?? "",
//   }));

//   return (
//     <section className="category-gallery" data-folder={folder}>
//       <h2>{folder}</h2>
//       <div className="image-grid">
//         {folderImages.map((img) => (
//           <img key={img.src} src={img.src} alt={img.alt} loading="lazy" />
//         ))}
//       </div>
//     </section>
//   );
// }
// src/components/CategoryGalleries.jsx
import React from "react";
import "./CategoryGalleries.css"; // ← add this

const allImages = import.meta.glob(
  "../assets/images/**/*.{png,jpg,jpeg,webp,svg}",
  { eager: true, import: "default" }
);

const IMAGE_MAP = {};
Object.entries(allImages).forEach(([path, url]) => {
  const parts = path.split("/");
  const folderName = parts[parts.length - 2];
  if (!IMAGE_MAP[folderName]) IMAGE_MAP[folderName] = [];
  IMAGE_MAP[folderName].push(url);
});

const CATEGORIES = Object.keys(IMAGE_MAP).sort();

export default function CategoryGalleries() {
  return (
    <div className="galleries-wrapper"> {/* ← add this wrapper */}
      {CATEGORIES.map((folder) => (
        <CategoryGallery key={folder} folder={folder} />
      ))}
    </div>
  );
}

function CategoryGallery({ folder }) {
  const imageUrls = IMAGE_MAP[folder] || [];
  if (imageUrls.length === 0) return null;

  const folderImages = imageUrls.map((url) => ({
    src: url,
    alt: url.split("/").pop()?.split(".")[0] ?? "",
  }));

  return (
    <section className="category-gallery" data-folder={folder}>
      <h2>{folder}</h2>
      <div className="image-grid">
        {folderImages.map((img) => (
          <img key={img.src} src={img.src} alt={img.alt} loading="lazy" />
        ))}
      </div>
    </section>
  );
}