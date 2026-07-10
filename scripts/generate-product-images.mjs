import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/assets/images");
const output = path.resolve("src/data/productImages.js");
const imageExtensions = new Set([".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
}

walk(root);
files.sort((left, right) => left.localeCompare(right, "en", { numeric: true }));

const imports = [];
const entries = [];

files.forEach((file, index) => {
  const variableName = `productImage${index}`;
  const importPath = `../${path
    .relative(path.resolve("src/data"), file)
    .replaceAll(path.sep, "/")}`;
  const relativeToImages = path.relative(root, file).replaceAll(path.sep, "/");
  const parts = relativeToImages.split("/");
  const folderName =
    parts[0] === "Thakur-ji-Poshak" && parts.length > 2 ? parts[1] : parts[0];
  const fileName = path.basename(file, path.extname(file));

  imports.push(`import ${variableName} from ${JSON.stringify(importPath)};`);
  entries.push(
    `  { folderName: ${JSON.stringify(folderName)}, fileName: ${JSON.stringify(
      fileName,
    )}, image: ${variableName} },`,
  );
});

const content = [
  ...imports,
  "",
  "const PRODUCT_IMAGE_ENTRIES = [",
  ...entries,
  "];",
  "",
  "const PRODUCT_IMAGE_MAP = PRODUCT_IMAGE_ENTRIES.reduce((map, entry) => {",
  '  const src = typeof entry.image === "string" ? entry.image : entry.image.src;',
  "  if (!map[entry.folderName]) {",
  "    map[entry.folderName] = [];",
  "  }",
  "",
  "  map[entry.folderName].push({",
  "    fileName: entry.fileName,",
  "    image: entry.image,",
  "    src,",
  "  });",
  "  return map;",
  "}, {});",
  "",
  "export default PRODUCT_IMAGE_MAP;",
  "",
].join("\n");

fs.writeFileSync(output, content, "utf8");
console.log(`Generated ${files.length} product image imports.`);
