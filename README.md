# 🪷 The Braj Madhuri

> **In sacred service of devotees.**

A modern, full-featured devotional e-commerce storefront built with **Next.js 16** and **React 19**, showcasing the complete range of The Braj Madhuri's products — pooja essentials, attars, poshak, dhoop, japa malas, and more — with a beautiful traditional aesthetic inspired by Vrindavan and Braj Dham.

---

## ✨ Live Features

### 🛍️ Product Catalog
- **Auto-generated galleries** from product image folders — no manual configuration needed
- **Image carousel** per product card with prev/next navigation and dot indicators
- **Discount badges** auto-calculated from original vs. current price
- **Smooth reveal animations** as cards scroll into view
- **Category filter** — click any category tile to jump straight to those products

### 🔍 Search
- **Real-time search** across all product titles and descriptions
- **Highlighted matches** — the matching keyword glows gold in the dropdown
- **Keyboard navigation** — ↑ ↓ arrows to browse, Enter to go, Escape to close
- **Quick suggestion chips** — tap Agarbatti, Poshak, Dhoop, Japa Mala, Chandan, Combo Pack to instantly search
- **Price shown** in each search result
- **"View all products →"** shortcut at the bottom of results
- Large, accessible 72px search bar visible and easy to use for all ages

### 🛒 Cart
- **Floating cart button** always visible at bottom-right corner
- **Cart count badge** on the header cart button
- Cart state is shared via React Context across all pages

### 📱 Responsive Design
- Works on **Mobile, Tablet, iPad, and Desktop**
- **Sticky navigation bar** that floats at the top as you scroll
- **Hamburger drawer menu** on mobile with smooth slide-in animation
- **Search icon** always accessible in the nav on every screen size

### 📄 Pages
| Route | Page |
|---|---|
| `/` | Home — Hero, Trust Bar, Category Grid, Product Galleries, Featured Banner, Combo Packs, Our Story, Reviews |
| `/shop` | Shop — Category filter + full product grid |
| `/combos` | Combos — Curated seva pack listing |
| `/about` | About — Story and brand values |
| `/contact` | Contact — WhatsApp, Email, Support hours |

---

## 🗂️ Project Structure

```
The Braj Madhuri/
├── public/
│   ├── Brand-Logo.jpeg          # Header banner image
│   └── favicon.svg              # Browser tab icon
│
├── src/
│   ├── App.css                  # Global design system & all shared CSS
│   │
│   ├── app/                     # Next.js App Router
│   │   ├── layout.jsx           # Root layout with metadata & SiteShell
│   │   ├── page.jsx             # Home page route → renders HomePage
│   │   ├── SiteShell.jsx        # Shared shell: Header + Newsletter + Footer + FloatingCart
│   │   ├── not-found.jsx        # 404 page
│   │   ├── shop/                # /shop route
│   │   ├── combos/              # /combos route
│   │   ├── contact/             # /contact route
│   │   └── about/               # /about route
│   │
│   ├── components/              # UI Components
│   │   ├── Header.jsx           # Banner image + sticky nav + hamburger drawer + search trigger
│   │   ├── Header.css           # Header + SearchBar styles
│   │   ├── SearchBar.jsx        # Real-time product search with dropdown
│   │   ├── SearchBar.css        # Search overlay, form, dropdown, chips styles
│   │   ├── Hero.jsx             # Homepage hero section with CTA buttons
│   │   ├── TrustBar.jsx         # "Natural | Devotional | Pan-India" trust strip
│   │   ├── CategoryGrid.jsx     # Category thumbnail filter tiles
│   │   ├── CategoryGrid.css     # Category grid styles
│   │   ├── Categories.jsx       # Full product gallery (image-card carousel per product)
│   │   ├── CategoryGalleries.css# Product card gallery styles
│   │   ├── FeaturedBanner.jsx   # "Sacred Scents of Braj" dark feature section
│   │   ├── ComboPacks.jsx       # 3-column seva combo card grid
│   │   ├── Story.jsx            # About section with brand values
│   │   ├── Reviews.jsx          # Star rating + Instagram embed + review cards
│   │   ├── Newsletter.jsx       # Email subscription section
│   │   ├── FloatingCart.jsx     # Fixed bottom-right floating cart button
│   │   └── Footer.jsx           # Links, social, contact info, copyright
│   │
│   ├── context/
│   │   └── CartContext.jsx      # Cart state context (addToCart, cartCount, cartTotal)
│   │
│   ├── data/
│   │   ├── productData.js       # Product titles, descriptions, prices
│   │   └── productImages.js     # Auto-generated image imports (grouped by folder)
│   │
│   └── assets/
│       └── images/              # Product images grouped by category folder
```

---

## 🛒 Product Catalog

All products are defined in [`src/data/productData.js`](src/data/productData.js).

| Category | Products | Price Range |
|---|---|---|
| Aggarbaties | Mogra, Kesar Chandan, Lavender, Sandalwood | ₹179 |
| Floral Scent Sprays | Mogra, Gulab, Jasmine, Shyam Darbar, Bela, Ashtagandh | ₹250 |
| Hawan Cups | Ready-to-use hawan cups (3 variants) | ₹180 |
| Incense & Dhoop Sticks | Kesar Chandan, Gulab, Mogra, Sandalwood, Panchratan | ₹120 |
| Premium Chandan Tilak | Ready-to-apply paste | ₹250 |
| Shank for Thakur Ji Snan | Sacred shank | ₹299 |
| Thakur Ji Shringar Attars | 10+ attars — Shyam Ras, Panchamrit, Gulab, Mogra, Chameli, etc. | ₹230 – ₹920 |
| Ubtan for Thakur Ji | Natural ayurvedic ubtan | ₹300 |
| Vastra & Perfumes | Attars, spray perfumes, Vrindavan fragrances | ₹230 – ₹300 |
| Thakur Ji Poshak (1-2 No) | Handcrafted poshak | ₹299 |
| Thakur Ji Poshak (2-3 No) | Beautiful festive poshak | ₹349 |
| Thakur Ji Poshak (3-4 No) | Elegant poshak | ₹399 |
| Thakur Ji Poshak (4 No) | Festive poshak | ₹449 |
| Thakur Ji Poshak (5 No) | Premium occasion poshak | ₹499 |

---

## 🎨 Design System

**Fonts (Google Fonts)**
- `Cinzel` — Headings, buttons, labels, nav links (elegant serif)
- `Cormorant Garamond` — Body text, descriptions (flowing & devotional)
- `Noto Sans Devanagari` — Devotional labels and trust bar text

**Color Palette**
| Token | Value | Usage |
|---|---|---|
| `--saffron` | `#E8721A` | CTA buttons, hover states |
| `--gold` | `#C9972A` | Dividers, badges, accents |
| `--gold-light` | `#E8C96B` | Hero text, feature highlights |
| `--maroon` | `#7B1B2A` | Section titles, nav, cart |
| `--cream` | `#FAF5EC` | Page background |
| `--ivory` | `#F5EDD8` | Card backgrounds |
| `--text` | `#2A1A0E` | Body text |
| `--text-muted` | `#7A5C40` | Subtitles, descriptions |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "The Braj Madhuri"

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start local development server at `localhost:3000` |
| `npm run build` | Create an optimised production build in `.next/` |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the entire project |

---

## 🔧 How to Update Content

### Add or Update a Product
Edit [`src/data/productData.js`](src/data/productData.js):
```js
"My-New-Category": {
  title: "My Product Title",
  description: "Short description for the catalog.",
  price: 299,
  originalPrice: 399,   // optional — shows discount badge
  items: {              // optional — add per-image variants
    "image-file-name": {
      title: "Variant Name",
      description: "Variant description.",
      price: 249,       // overrides category-level price
    }
  }
}
```

### Add Product Images
1. Create a new folder inside `src/assets/images/` with a meaningful name (e.g. `Japa-Mala`)
2. Add your product `.png` or `.jpg` images into that folder
3. The gallery and category grid will automatically include it on next build

### Update Header Banner
Replace `public/Brand-Logo.jpeg` with your new wide banner image.

### Update Contact Details
- **Phone / WhatsApp:** [`src/pages/ContactPage.jsx`](src/pages/ContactPage.jsx) and [`src/components/Footer.jsx`](src/components/Footer.jsx)
- **Email:** Same files as above

---

## 📱 Browser & Device Support

| Device | Layout |
|---|---|
| Mobile (< 640px) | Single column, hamburger menu, compact nav |
| Tablet / iPad (640–1024px) | 2-column grid, responsive spacing |
| Desktop (> 1024px) | Full multi-column layout, horizontal nav |

---

## 📞 Contact

- **WhatsApp:** [+91 84489 04455](https://wa.me/918448904455)
- **Email:** [brajmadhuriofficial@gmail.com](mailto:brajmadhuriofficial@gmail.com)
- **Instagram:** [@brajmadhuri.official](https://www.instagram.com/brajmadhuri.official)
- **Support Hours:** Mon – Sun | 10:00 AM – 8:00 PM (IST)

---

<div align="center">
  <strong>🪷 Jai Shri Krishna · Radhe Radhe 🪷</strong><br/>
  <em>The Braj Madhuri — Born in Vrindavan, Crafted with Devotion</em>
</div>
