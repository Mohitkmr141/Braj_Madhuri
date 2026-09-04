import { Suspense } from "react";
import SiteShell from "./SiteShell.jsx";
import { ToastProvider } from "../context/ToastContext.jsx";
import "../App.css";
import { GoogleAnalytics } from '@next/third-parties/google';
import {
  Playfair_Display,
  Inter,
  Plus_Jakarta_Sans,
  Cinzel_Decorative,
  Cormorant_Garamond,
  Noto_Sans_Devanagari,
} from "next/font/google";
import { unstable_cache } from "next/cache";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  variable: "--font-cinzel-decorative",
  display: "swap",
  weight: ["400", "700", "900"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4A1521",
};

export const metadata = {
  metadataBase: new URL("https://thebrajmadhuri.com"),
  manifest: "/manifest.json",
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
    apple: "/Logo.jpeg",
  },
  alternates: {
    canonical: "https://thebrajmadhuri.com",
  },
};

import { getPrisma } from "../lib/prisma.js";

const fetchInitialCategories = unstable_cache(
  async () => {
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
  },
  ["initial-categories-cache"],
  { tags: ["categories"] }
);

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
    <html lang="en-IN" className={`${playfair.variable} ${inter.variable} ${plusJakartaSans.variable} ${cinzelDecorative.variable} ${cormorantGaramond.variable} ${notoSansDevanagari.variable}`}>
      <head>
        <link rel="preconnect" href="https://vdujlymtqvmztikeokje.supabase.co" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Suspense fallback={
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FDFBF7" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #E8C96B", borderTopColor: "#4A1521", borderRadius: "50%", animation: "bmSpin 0.8s linear infinite" }} />
            <style>{`@keyframes bmSpin { to { transform: rotate(360deg); } }`}</style>
          </div>
        }>
          <ToastProvider>
            <SiteShell initialCategories={categories}>{children}</SiteShell>
          </ToastProvider>
        </Suspense>
        <GoogleAnalytics gaId="G-E2XC6LB5PH" />
      </body>
    </html>
  );
}
