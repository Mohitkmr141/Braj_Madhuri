import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.resolve(__dirname, '../../public/images');
const outputFile = path.resolve(__dirname, 'productImages.js');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const mapEntries = [];
let imgCounter = 0;

walkDir(imagesDir, (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    const relativePath = path.relative(imagesDir, filePath);
    // Replace windows backslashes with forward slashes for URLs
    const urlPath = relativePath.split(path.sep).join('/');
    
    // The folder name is the relative directory (e.g. "Dhoop & Incense/Aggarbaties")
    const dirName = path.dirname(relativePath);
    let folderName = dirName === '.' ? '' : dirName.split(path.sep).join('/');
    folderName = folderName.replace(/^(images|products)\//, '');
    const fileName = path.basename(relativePath, ext);
    
    // Create static URL path
    const srcStr = `/images/${urlPath}`;
    
    mapEntries.push(`  { folderName: ${JSON.stringify(folderName)}, fileName: ${JSON.stringify(fileName)}, image: ${JSON.stringify(srcStr)} },`);
    imgCounter++;
  }
});

const fileContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Run \`node src/data/generateImages.mjs\` to regenerate this file when adding new images.

const ALL_ENTRIES = [
${mapEntries.join('\n')}
];

const PRODUCT_IMAGE_MAP = ALL_ENTRIES.reduce((map, entry) => {
  const src = entry.image;
  if (!map[entry.folderName]) {
    map[entry.folderName] = [];
  }
  map[entry.folderName].push({
    fileName: entry.fileName,
    image: src,
    src,
  });
  return map;
}, {});

export default PRODUCT_IMAGE_MAP;
`;

fs.writeFileSync(outputFile, fileContent, 'utf-8');
console.log(`Generated productImages.js with ${imgCounter} image static paths.`);
