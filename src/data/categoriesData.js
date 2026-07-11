/**
 * Master category definitions for Braj Madhuri.
 *
 * Each entry defines:
 *   - id          : unique slug used in URLs  (?category=<id>)
 *   - label       : human-readable display name shown on the UI
 *   - emoji       : decorative emoji for the category card (optional)
 *   - folderKeys  : one or more keys from PRODUCT_IMAGE_MAP used to pull
 *                   the representative thumbnail (first image of first key wins)
 *   - subcategories: list of sub-category names shown in the dropdown / filter
 */

const CATEGORIES = [
  {
    id: "itra-fragrances",
    label: "Itra & Fragrances",
    emoji: "🌸",
    folderKeys: ["Thakur-ji-Shriang", "Vastra", "Floral-Scent"],
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
    folderKeys: ["Categories", "Spritual Accessories"],
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
    folderKeys: ["Divine Tilak Essentials", "Premium-Chandan-Tilak", "Ubtan-for-Thakur-Ji"],
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
    folderKeys: ["Categories", "Spritual Accessories"],
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
    folderKeys: ["Spritual Accessories", "Categories"],
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
    subcategories: [],
  },
  {
    id: "best-sellers",
    label: "Best Sellers",
    emoji: "🏆",
    folderKeys: ["Thakur-ji-Shriang", "Aggarbaties", "1-2 No Poshak"],
    subcategories: [],
  },
  {
    id: "offers-sale",
    label: "Offers & Sale",
    emoji: "🎉",
    folderKeys: ["Vedic Cups", "Everyday Aroma Dhoop Sticks", "Floral-Scent"],
    subcategories: [],
  },
];

export default CATEGORIES;
