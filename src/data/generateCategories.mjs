import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The actual image directories that contain files
const dirsWithImages = [
  "Bhakti Combos/Braj Bhakti Kit",
  "Bhakti Combos/Nitya Seva Kits",
  "Dhoop & Incense/Aggarbaties",
  "Dhoop & Incense/Dhoop Sticks & Dhoop Cones/Dhoop Cones",
  "Dhoop & Incense/Dhoop Sticks & Dhoop Cones/Everyday Aroma Dhoop Sticks",
  "Dhoop & Incense/Dhoop Sticks & Dhoop Cones/Signature Fragrance Collection",
  "Dhoop & Incense/Dhoop Sticks & Dhoop Cones/Traditional Dhoop Sticks",
  "Dhoop & Incense/Vedic Havan Cups",
  "Divine Tilak Essentials",
  "Itra & Fragnances/Shri Ang Itra",
  "Itra & Fragnances/Temple & Home Fragnance Spray",
  "Itra & Fragnances/Vastra Itra",
  "Jewellery/Najariya for Ladduu Gopal (Size 4,5,6)",
  "Laddu Gopal Essentials/Aasans",
  "Laddu Gopal Essentials/Premium-Chandan-Tilak",
  "Laddu Gopal Essentials/Shank-for-Thakur-ji-Snan",
  "Laddu Gopal Essentials/Thakur-ji-Shriang",
  "Laddu Gopal Essentials/Ubtan for Snan",
  "Laddu Gopal Essentials/Vastra",
  "Pooja Essentials",
  "Spritual Accessories",
  "Thakur Ji Shringar/Jewellery/Long Mala(4.5 inches)",
  "Thakur Ji Shringar/Jewellery/New folder",
  "Thakur Ji Shringar/Jewellery/New folder/Slideshow",
  "Thakur Ji Shringar/Jewellery/Pearl Kundan Mala",
  "Thakur Ji Shringar/Mukut",
  "Tulsi Kanthi Mala/Kanthi Mala Regular",
  "Tulsi Kanthi Mala/Kathi Mala Fine Beads",
  "Tulsi Kanthi Mala/Tulsi Designer Mala",
  "Tulsi Kanthi Mala/Tulsi Mala Single Round"
];

// Mapping emojis
const emojis = {
  "Laddu Gopal Essentials": "🛏️",
  "Pooja Essentials": "🪔",
  "Spritual Accessories": "🏛️",
  "Dhoop & Incense": "🕯️",
  "Thakur Ji Shringar": "👑",
  "Tulsi Kanthi Mala": "📿",
  "Jewellery": "💍",
  "Bhakti Combos": "🎁",
  "Poshak": "🥻",
  "Itra & Fragnances": "🌸",
  "Divine Tilak Essentials": "✨",
  "Pooja Samagri": "🥥"
};

const mainCategories = [
  "Laddu Gopal Essentials",
  "Pooja Essentials",
  "Spritual Accessories",
  "Dhoop & Incense",
  "Thakur Ji Shringar",
  "Tulsi Kanthi Mala",
  "Jewellery",
  "Bhakti Combos",
  "Poshak",
  "Itra & Fragnances",
  "Divine Tilak Essentials",
  "Pooja Samagri"
];

const categories = [];

mainCategories.forEach(main => {
  const matchingDirs = dirsWithImages.filter(d => d.startsWith(main + '/') || d === main);
  const subcategories = [...new Set(matchingDirs.map(d => {
    const parts = d.split('/');
    return parts.length > 1 ? parts[1] : null;
  }).filter(Boolean))];

  const subcategoryFolderMap = {};
  subcategories.forEach(sub => {
    subcategoryFolderMap[sub] = matchingDirs.filter(d => d.includes(`/${sub}`));
  });

  categories.push({
    id: main.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
    label: main,
    emoji: emojis[main] || "📦",
    folderKeys: matchingDirs.length > 0 ? matchingDirs : [main],
    subcategoryFolderMap,
    subcategories
  });
});

const fileContent = `const CATEGORIES = ${JSON.stringify(categories, null, 2)};\n\nexport default CATEGORIES;\n`;

fs.writeFileSync(path.resolve(__dirname, 'categoriesData.js'), fileContent, 'utf-8');
console.log('Categories generated successfully.');
