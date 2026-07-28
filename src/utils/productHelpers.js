import CATEGORIES from "../data/categoriesData.js";

export const formatFolderName = (name) => {
  if (!name) return "";
  const parts = name.split("/");
  return parts[parts.length - 1].replaceAll("-", " ");
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
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

  if (filterFolder) {
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
    const query = searchQuery.trim().toLowerCase();
    
    products = products.filter(p => {
      const imgTitle = (p.title || "").toLowerCase();
      const imgDesc = (p.description || p.categoryDesc || "").toLowerCase();
      return imgTitle.includes(query) || imgDesc.includes(query);
    });

    return {
      products,
      title: filterFolder && !isAll ? title : `Search Results for "${searchQuery}"`,
      isAll: false,
    };
  }

  return { products, title, isAll };
}

/**
 * Sorts products based on sort order ("low-to-high" or "high-to-low")
 */
export function sortProducts(products, sortOrder) {
  if (sortOrder === "low-to-high") {
    return [...products].sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortOrder === "high-to-low") {
    return [...products].sort((a, b) => (b.price || 0) - (a.price || 0));
  }
  return products;
}
