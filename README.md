# 🪷 The Braj Madhuri

> **In sacred service of devotees.**

A modern, full-featured devotional e-commerce storefront built with **Next.js 16**, **React 19**, and a **Supabase PostgreSQL** database via **Prisma ORM**, showcasing the complete range of The Braj Madhuri's products — pooja essentials, attars, poshak, dhoop, japa malas, and more — with a beautiful traditional aesthetic inspired by Vrindavan and Braj Dham.

---

## ✨ Live Features

### 🛍️ Product Catalog
- **Database-driven catalog** using Prisma and Supabase.
- **Auto-generated galleries** mapped from product image folders.
- **Image carousel** per product card with prev/next navigation and dot indicators.
- **Discount badges** auto-calculated from original vs. current price.
- **Smooth reveal animations** as cards scroll into view.
- **Category filter** — click any category tile to jump straight to those products.

### 🔍 Search
- **Real-time search** across all product titles and descriptions.
- **Highlighted matches** — the matching keyword glows gold in the dropdown.
- **Keyboard navigation** — ↑ ↓ arrows to browse, Enter to go, Escape to close.
- **Quick suggestion chips** — tap Agarbatti, Poshak, Dhoop, Japa Mala, Chandan, Combo Pack to instantly search.
- **Price shown** in each search result.
- Large, accessible 72px search bar visible and easy to use for all ages.

### 🛒 Cart
- **Floating cart button** always visible at bottom-right corner.
- **Cart count badge** on the header cart button.
- Cart state is shared via React Context across all pages.

### 📱 Responsive Design
- Works on **Mobile, Tablet, iPad, and Desktop**.
- **Sticky navigation bar** that floats at the top as you scroll.
- **Hamburger drawer menu** on mobile with smooth slide-in animation.

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
├── prisma/
│   └── schema.prisma            # Database schema models (Category, Product)
│
├── public/
│   ├── Brand-Logo.jpeg          # Header banner image
│   └── favicon.svg              # Browser tab icon
│
├── scripts/
│   └── seed.js                  # Database seeding script
│
├── src/
│   ├── App.css                  # Global design system & all shared CSS
│   │
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API routes (e.g. /api/products)
│   │   ├── layout.jsx           # Root layout with metadata & SiteShell
│   │   ├── page.jsx             # Home page route → renders HomePage
│   │   ├── SiteShell.jsx        # Shared shell: Header + Newsletter + Footer + FloatingCart
│   │   ├── shop/                # /shop route
│   │   ├── combos/              # /combos route
│   │   ├── contact/             # /contact route
│   │   └── about/               # /about route
│   │
│   ├── components/              # UI Components
│   │   └── ...                  # Header, SearchBar, CategoryGalleries, etc.
│   │
│   ├── context/
│   │   └── CartContext.jsx      # Cart state context
│   │
│   ├── data/
│   │   ├── productData.js       # Product initial seed data
│   │   └── productImages.js     # Auto-generated image imports
│   │
│   └── assets/
│       └── images/              # Product images grouped by category folder
```

---

## 🛒 Product Catalog

The product catalog is now served via a **Supabase PostgreSQL** database. The initial data and any new items are managed in [`src/data/productData.js`](src/data/productData.js) and seeded into the DB.

---

## 🎨 Design System

**Fonts (Google Fonts)**
- `Cinzel` — Headings, buttons, labels, nav links (elegant serif)
- `Cormorant Garamond` — Body text, descriptions (flowing & devotional)
- `Noto Sans Devanagari` — Devotional labels and trust bar text

**Color Palette**
- `--saffron`: `#E8721A` | `--gold`: `#C9972A` | `--gold-light`: `#E8C96B` | `--maroon`: `#7B1B2A` | `--cream`: `#FAF5EC` | `--ivory`: `#F5EDD8` | `--text`: `#2A1A0E` | `--text-muted`: `#7A5C40`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A Supabase Project URL and Database Password

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "The Braj Madhuri"

# Install dependencies
npm install
```

### Database Setup

1. Create a `.env` file in the root directory based on your Supabase credentials:
   ```env
   # Transactional connection for Prisma
   DATABASE_URL="postgres://postgres.xxx:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Direct connection for migrations
   DIRECT_URL="postgres://postgres.xxx:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

2. Initialize your database schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Seed the database with product data:
   ```bash
   node scripts/seed.js
   ```

### Start Server
```bash
# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start local development server at `localhost:3000` |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build locally |
| `npx prisma db push` | Push schema changes to Supabase |
| `npx prisma studio` | Open a local web UI to view and edit database rows |
| `node scripts/seed.js`| Re-run the script to sync local data files to the DB |

---

## 🔧 How to Update Content

### Add or Update a Product
1. Add new images into `src/assets/images/<Category-Name>/`.
2. Add the title and price mappings inside [`src/data/productData.js`](src/data/productData.js):
   ```js
   "My-New-Category": {
     title: "My Product Title",
     price: 299,
     originalPrice: 399,
     items: {
       "image-file-name": {
         title: "Variant Name",
         price: 249,
       }
     }
   }
   ```
3. Run the image generation script if required, then re-seed the database:
   ```bash
   node scripts/seed.js
   ```

### Update Header Banner
Replace `public/Brand-Logo.jpeg` with your new wide banner image.

### Update Contact Details
Edit [`src/pages/ContactPage.jsx`](src/pages/ContactPage.jsx) and [`src/components/Footer.jsx`](src/components/Footer.jsx).

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
