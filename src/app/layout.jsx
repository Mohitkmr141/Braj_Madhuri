import { Suspense } from "react";
import SiteShell from "./SiteShell.jsx";
import { ToastProvider } from "../context/ToastContext.jsx";
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
  alternates: {
    canonical: "https://thebrajmadhuri.com",
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://thebrajmadhuri.com/#organization",
        "name": "The Braj Madhuri",
        "url": "https://thebrajmadhuri.com",
        "logo": "https://thebrajmadhuri.com/Logo.jpeg"
      },
      {
        "@type": "WebSite",
        "@id": "https://thebrajmadhuri.com/#website",
        "url": "https://thebrajmadhuri.com",
        "name": "The Braj Madhuri",
        "publisher": {
          "@id": "https://thebrajmadhuri.com/#organization"
        }
      }
    ]
  };

  return (
    <html lang="en-IN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <ToastProvider>
            <SiteShell initialCategories={categories}>{children}</SiteShell>
          </ToastProvider>
        </Suspense>
      </body>
    </html>
  );
}
