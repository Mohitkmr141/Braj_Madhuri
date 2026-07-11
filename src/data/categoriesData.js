/**
 * Master category definitions for Braj Madhuri.
 *
 * Each entry defines:
 *   - id                 : unique slug used in URLs  (?category=<id>)
 *   - label              : human-readable display name shown on the UI
 *   - emoji              : decorative emoji for the category card (optional)
 *   - folderKeys         : one or more keys from PRODUCT_IMAGE_MAP used to pull
 *                          the representative thumbnail (first image of first key wins)
 *   - subcategoryFolderMap: maps subcategory display name → array of PRODUCT_IMAGE_MAP keys
 *   - subcategories      : list of sub-category names shown in the dropdown / filter
 */

const CATEGORIES = [
  {
    id: "itra-fragrances",
    label: "Itra & Fragrances",
    emoji: "🌸",
    folderKeys: ["Shri Ang Itra", "Vastra Itra", "Floral-Scent"],
    subcategoryFolderMap: {
      "Shri Ang Itra": ["Shri Ang Itra"],
      "Vastr Itra": ["Vastra Itra"],
      "Summer Itra": ["Floral-Scent"],
      "Winter Itra": ["Floral-Scent"],
      "Temple Fragrance Spray": ["Floral-Scent"],
      "Home Fragrance Spray": ["Floral-Scent"],
      "Rose Water": ["Floral-Scent"],
    },
    subcategories: [
      "Shri Ang Itra",
      "Vastr Itra",
      "Summer Itra",
      "Winter Itra",
      "Temple Fragrance Spray",
      "Home Fragrance Spray",
      "Rose Water",
    ],
  },
  {
    id: "thakur-ji-shringar",
    label: "Thakur Ji Shringar",
    emoji: "👑",
    folderKeys: ["Thakur-ji-Shriang", "Spritual Accessories"],
    subcategoryFolderMap: {
      "Jewellery": ["Thakur-ji-Shriang"],
      "Mukut": ["Thakur-ji-Shriang"],
      "Mor Pankh": ["Spritual Accessories"],
      "Tilak Accessories": ["Divine Tilak Essentials"],
      "Shringar Accessories": ["Spritual Accessories"],
    },
    subcategories: [
      "Jewellery",
      "Mukut",
      "Mor Pankh",
      "Tilak Accessories",
      "Shringar Accessories",
    ],
  },
  {
    id: "poshak-collection",
    label: "Poshak Collection",
    emoji: "🥻",
    folderKeys: ["1-2 No Poshak", "2-3 No Poshak", "3-4 No Poshak", "4 Poshak", "5 Poshak"],
    subcategoryFolderMap: {
      "Summer Poshak": ["3-4 No Poshak", "4 Poshak"],
      "Winter Poshak": ["3-4 No Poshak", "5 Poshak"],
      "Festival Poshak": ["4 Poshak", "5 Poshak"],
      "Designer Poshak": ["5 Poshak"],
    },
    subcategories: [
      "Summer Poshak",
      "Winter Poshak",
      "Festival Poshak",
      "Designer Poshak",
    ],
  },
  {
    id: "laddu-gopal-essentials",
    label: "Laddu Gopal Essentials",
    emoji: "🛏️",
    folderKeys: ["Spritual Accessories", "Categories"],
    subcategoryFolderMap: {
      "Beds & Bedding": ["Spritual Accessories"],
      "Travel Bags": ["Spritual Accessories"],
      "Blankets": ["Spritual Accessories"],
      "Daily Seva Accessories": ["Spritual Accessories"],
    },
    subcategories: [
      "Beds & Bedding",
      "Travel Bags",
      "Blankets",
      "Daily Seva Accessories",
    ],
  },
  {
    id: "puja-essentials",
    label: "Puja Essentials",
    emoji: "🪔",
    folderKeys: ["Divine Tilak Essentials", "Premium-Chandan-Tilak"],
    subcategoryFolderMap: {
      "Camphor": ["Divine Tilak Essentials"],
      "Chandan": ["Premium-Chandan-Tilak"],
      "Kumkum": ["Divine Tilak Essentials"],
      "Roli": ["Divine Tilak Essentials"],
      "Akshat": ["Divine Tilak Essentials"],
      "Cotton Wicks (Batti)": ["Divine Tilak Essentials"],
      "Puja Accessories": ["Divine Tilak Essentials"],
    },
    subcategories: [
      "Camphor",
      "Chandan",
      "Kumkum",
      "Roli",
      "Akshat",
      "Cotton Wicks (Batti)",
      "Puja Accessories",
    ],
  },
  {
    id: "dhoop-incense",
    label: "Dhoop & Incense",
    emoji: "🕯️",
    folderKeys: [
      "Everyday Aroma Dhoop Sticks",
      "Traditional Dhoop Sticks",
      "Vedic Cups",
      "Aggarbaties",
      "Signature Fragrance Collection",
    ],
    subcategoryFolderMap: {
      "Dhoop Sticks": ["Everyday Aroma Dhoop Sticks", "Traditional Dhoop Sticks"],
      "Incense Sticks": ["Aggarbaties", "Signature Fragrance Collection"],
      "Dhoop Cones": ["Traditional Dhoop Sticks"],
      "Havan Cups": ["Vedic Cups"],
      "Sambrani": ["Everyday Aroma Dhoop Sticks"],
    },
    subcategories: [
      "Dhoop Sticks",
      "Incense Sticks",
      "Dhoop Cones",
      "Havan Cups",
      "Sambrani",
    ],
  },
  {
    id: "japa-essentials",
    label: "Japa Essentials",
    emoji: "📿",
    folderKeys: ["Tulsi Mala"],
    subcategoryFolderMap: {
      "Tulsi Japa Mala": ["Tulsi Mala"],
      "Kanthi Mala": ["Tulsi Mala"],
      "Bead Bags": ["Tulsi Mala"],
      "Sakshi Mala": ["Tulsi Mala"],
      "Digital Counter": ["Tulsi Mala"],
    },
    subcategories: [
      "Tulsi Japa Mala",
      "Kanthi Mala",
      "Bead Bags",
      "Sakshi Mala",
      "Digital Counter",
    ],
  },
  {
    id: "temple-decor",
    label: "Temple Decor",
    emoji: "🏛️",
    folderKeys: ["Spritual Accessories"],
    subcategoryFolderMap: {
      "Singhasan": ["Spritual Accessories"],
      "Chowki": ["Spritual Accessories"],
      "Jhula": ["Spritual Accessories"],
      "Temple Decoration": ["Spritual Accessories"],
    },
    subcategories: [
      "Singhasan",
      "Chowki",
      "Jhula",
      "Temple Decoration",
    ],
  },
  {
    id: "bhakti-kits-combos",
    label: "Bhakti Kits & Combos",
    emoji: "🎁",
    folderKeys: ["Spritual Accessories"],
    subcategoryFolderMap: {
      "Nitya Seva Kit": ["Spritual Accessories"],
      "Braj Bhakti Kit": ["Spritual Accessories"],
      "Gift Boxes": ["Spritual Accessories"],
      "Combo Packs": ["Spritual Accessories"],
    },
    subcategories: [
      "Nitya Seva Kit",
      "Braj Bhakti Kit",
      "Gift Boxes",
      "Combo Packs",
    ],
  },
  {
    id: "festival-collection",
    label: "Festival Collection",
    emoji: "✨",
    folderKeys: ["Floral-Scent", "Signature Fragrance Collection"],
    subcategoryFolderMap: {
      "Janmashtami": ["Signature Fragrance Collection"],
      "Radhashtami": ["Signature Fragrance Collection"],
      "Jhulan Yatra": ["Floral-Scent"],
      "Kartik": ["Floral-Scent"],
      "Holi": ["Floral-Scent"],
      "Diwali": ["Signature Fragrance Collection"],
    },
    subcategories: [
      "Janmashtami",
      "Radhashtami",
      "Jhulan Yatra",
      "Kartik",
      "Holi",
      "Diwali",
    ],
  },
  {
    id: "braj-specials",
    label: "Braj Specials",
    emoji: "🦚",
    folderKeys: ["Vastra", "Thakur-ji-Shriang"],
    subcategoryFolderMap: {
      "Braj Raj": ["Thakur-ji-Shriang"],
      "Govardhan Collection": ["Vastra"],
      "Vrindavan Exclusive Products": ["Thakur-ji-Shriang"],
    },
    subcategories: [
      "Braj Raj",
      "Govardhan Collection",
      "Vrindavan Exclusive Products",
    ],
  },
  {
    id: "new-arrivals",
    label: "New Arrivals",
    emoji: "🌟",
    folderKeys: ["Signature Fragrance Collection", "Spritual Accessories", "Divine Tilak Essentials"],
    subcategoryFolderMap: {},
    subcategories: [],
  },
  {
    id: "best-sellers",
    label: "Best Sellers",
    emoji: "🏆",
    folderKeys: ["Thakur-ji-Shriang", "Aggarbaties", "Shri Ang Itra"],
    subcategoryFolderMap: {},
    subcategories: [],
  },
  {
    id: "offers-sale",
    label: "Offers & Sale",
    emoji: "🎉",
    folderKeys: ["Vedic Cups", "Everyday Aroma Dhoop Sticks", "Floral-Scent"],
    subcategoryFolderMap: {},
    subcategories: [],
  },
];

export default CATEGORIES;
