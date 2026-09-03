import CATEGORIES from "../data/categoriesData.js";

export const formatFolderName = (name) => {
  if (!name) return "";
  const parts = name.split("/");
  return parts[parts.length - 1].replaceAll("-", " ");
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);

/**
 * Resolves the display label for a category id.
 */
export const CATEGORY_LABEL_MAP = {};
CATEGORIES.forEach((cat) => {
  CATEGORY_LABEL_MAP[cat.id] = cat.label;
});

/**
 * Given a filterFolder value, return the list of products to display.
 */
export function resolveFilter(filterFolder, searchQuery, allProducts) {
  let products = allProducts;
  let title = "Devotional Essentials";
  let isAll = true;

  if (filterFolder === "bestsellers") {
    const pinned = allProducts.filter(p => p.isBestseller);
    const topSellers = allProducts
      .filter(p => !p.isBestseller)
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 20);
    products = [...pinned, ...topSellers];
    title = "Our Bestsellers 🔥";
    isAll = false;
  } else if (filterFolder) {
    // If it's a subcategory compound key: "categoryId::SubName"
    if (filterFolder.includes("::")) {
      const [catId, subName] = filterFolder.split("::", 2);
      
      // Try to find a dynamic label from the products first, fallback to static map
      const dbMatch = allProducts.find(p => p.categoryId === catId);
      const catLabel = dbMatch?.categoryTitle || CATEGORY_LABEL_MAP[catId] || catId;
      
      products = allProducts.filter(p => {
        return p.categoryId === catId && (
          p.subcategory?.title === subName || 
          (p.folderName && p.folderName.split('/').pop() === subName)
        );
      });
      
      title = `${catLabel} — ${subName}`;
      isAll = false;
    } else {
      // It's a top-level category id
      products = allProducts.filter(p => {
        return p.categoryId === filterFolder;
      });
      
      // Try to find a dynamic label from the products first
      const dbMatch = products.find(p => p.categoryId === filterFolder);
      title = dbMatch?.categoryTitle || CATEGORY_LABEL_MAP[filterFolder] || filterFolder;
      isAll = false;
    }
  }

  if (searchQuery) {
    const rawQuery = searchQuery.trim().toLowerCase();
    const tokens = rawQuery.split(/\s+/).filter(t => t.length > 0);
    
    const isMatch = (p) => {
      const searchTarget = [
        p.title || "",
        p.subheading || "",
        p.description || "",
        p.categoryTitle || "",
        p.categoryDesc || "",
        p.subcategory?.title || "",
        Array.isArray(p.colors) ? p.colors.join(" ") : "",
        p.size || "",
      ].join(" ").toLowerCase();

      // Full phrase match or all tokens matched
      if (searchTarget.includes(rawQuery)) return true;
      return tokens.every(token => searchTarget.includes(token));
    };

    // If searching, search across all products to avoid restricting users who had a filter selected
    const searchSource = filterFolder && !filterFolder.includes("bestsellers") ? products : allProducts;
    let matchedProducts = searchSource.filter(isMatch);

    // If no products matched in current category filter, fallback to searching all products
    if (matchedProducts.length === 0 && searchSource !== allProducts) {
      matchedProducts = allProducts.filter(isMatch);
    }

    return {
      products: matchedProducts,
      title: `Search Results for "${searchQuery}"`,
      isAll: false,
    };
  }

  return { products, title, isAll };
}

/**
 * Gets the effective display price for a product.
 * If variants exist, returns the minimum variant price (what customers see first).
 */
export function getEffectivePrice(product) {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const variantPrices = product.variants
      .map(v => parseFloat(v.price))
      .filter(p => !isNaN(p) && p > 0);
    if (variantPrices.length > 0) {
      return Math.min(...variantPrices);
    }
  }
  return parseFloat(product.price) || 0;
}

export function isProductOutOfStock(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length > 0) {
    const total = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    return total <= 0;
  }
  return (parseInt(product.stock, 10) || 0) <= 0;
}

/**
 * Sorts products based on sort order ("low-to-high" or "high-to-low").
 * Uses effective variant price when variants exist.
 * Pushes out-of-stock items to the bottom.
 */
export function sortProducts(products, sortOrder) {
  let sorted = [...products];

  if (sortOrder === "low-to-high") {
    sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
  } else if (sortOrder === "high-to-low") {
    sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
  }

  // Push out of stock to bottom, maintaining relative sorted order otherwise
  sorted.sort((a, b) => {
    const aOut = isProductOutOfStock(a);
    const bOut = isProductOutOfStock(b);
    if (aOut && !bOut) return 1;
    if (!aOut && bOut) return -1;
    return 0;
  });

  return sorted;
}
