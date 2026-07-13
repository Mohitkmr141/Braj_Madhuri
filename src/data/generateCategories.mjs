import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesFile = path.resolve(__dirname, 'productImages.js');
const outputFile = path.resolve(__dirname, 'categoriesData.js');

const content = fs.readFileSync(imagesFile, 'utf8');
const folderNames = [...new Set([...content.matchAll(/folderName:\s*"([^"]+)"/g)].map(m => m[1]))];

const EMOJIS = {
  "Bhakti Combos": "🎁",
  "Dhoop & Incense": "🕯️",
  "Divine Tilak Essentials": "✨",
  "Itra & Fragnances": "🌸",
  "Jaap Essentials": "🙏",
  "Jewellery Collection": "👑",
  "Laddu Gopal Essentials": "🛏️",
  "Pooja Essentials": "🪔",
  "Poshak": "🥻",
  "Spritual Accessories": "🏛️",
  "Tulsi Kanthi Mala": "📿",
};

const catMap = {};

for (const folderName of folderNames) {
  if (!folderName) continue;
  
  const parts = folderName.split('/');
  const catName = parts[0];
  const subName = parts.length > 1 ? parts[1] : null;

  if (!catMap[catName]) {
    catMap[catName] = {
      id: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: catName,
      emoji: EMOJIS[catName] || "✨",
      folderKeys: [],
      subcategoryFolderMap: {},
      subcategories: new Set()
    };
  }

  catMap[catName].folderKeys.push(folderName);
  
  if (subName) {
    catMap[catName].subcategories.add(subName);
    if (!catMap[catName].subcategoryFolderMap[subName]) {
      catMap[catName].subcategoryFolderMap[subName] = [];
    }
    catMap[catName].subcategoryFolderMap[subName].push(folderName);
  }
}

const CATEGORIES = Object.values(catMap).map(cat => ({
  ...cat,
  subcategories: [...cat.subcategories]
}));

const outContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY\n// Run \`node src/data/generateCategories.mjs\` to regenerate this file.\n\nconst CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};\n\nexport default CATEGORIES;\n`;
fs.writeFileSync(outputFile, outContent, 'utf8');
console.log('Categories generated successfully.');
