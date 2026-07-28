import { Suspense } from "react";
import SiteShell from "./SiteShell.jsx";
import "../App.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  metadataBase: new URL("https://thebrajmadhuri.com"),
  title: {
    default: "The Braj Madhuri - Devotional Essentials",
    template: "%s | The Braj Madhuri",
  },
  description:
    "Devotional essentials, pooja fragrances, poshak, mala, dhoop, and seva products from The Braj Madhuri.",
  keywords: ["The Braj Madhuri", "Devotional Essentials", "Pooja Items", "Poshak", "Mala", "Dhoop", "Seva Products", "Vrindavan items"],
  openGraph: {
    title: "The Braj Madhuri - Devotional Essentials",
    description: "Authentic devotional essentials, pooja fragrances, poshak, and mala from The Braj Madhuri.",
    url: "https://thebrajmadhuri.com",
    siteName: "The Braj Madhuri",
    images: [
      {
        url: "/Logo.jpeg",
        width: 800,
        height: 600,
        alt: "The Braj Madhuri Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Braj Madhuri - Devotional Essentials",
    description: "Authentic devotional essentials, pooja fragrances, poshak, and mala from The Braj Madhuri.",
    images: ["/Logo.jpeg"],
  },
  icons: {
    icon: "/Logo.jpeg",
  },
};

import { getPrisma } from "../lib/prisma.js";

async function fetchInitialCategories() {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            subcategory: true
          }
        },
        subcategories: true,
      },
    });
    return categories;
  } catch (error) {
    console.error("Failed to fetch initial products:", error);
    return [];
  }
}

export default async function RootLayout({ children }) {
  const categories = await fetchInitialCategories();

  return (
    <html lang="en-IN">
      <body>
        <Suspense fallback={null}>
          <SiteShell initialCategories={categories}>{children}</SiteShell>
        </Suspense>
      </body>
    </html>
  );
}
