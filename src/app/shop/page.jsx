import { Suspense } from "react";
import ShopPage from "../../views/ShopPage.jsx";

import { getPrisma } from "../../lib/prisma.js";

export async function generateMetadata({ searchParams }) {
  // Extract search params (Next.js 15+ searchParams is a Promise)
  const resolvedParams = await searchParams;
  const categoryParam = resolvedParams?.category;
  
  if (categoryParam) {
    // Parse "catId::SubName" if it's a subcategory
    const isSubcategory = categoryParam.includes("::");
    const catId = isSubcategory ? categoryParam.split("::")[0] : categoryParam;
    
    try {
      const prisma = getPrisma();
      const category = await prisma.category.findUnique({
        where: { id: catId }
      });
      
      if (category) {
        const title = isSubcategory 
          ? `${categoryParam.split("::")[1]} - ${category.title}` 
          : category.title;
          
        return {
          title: `${title} | Shop Devotional Items`,
          description: category.description || `Browse our collection of ${title}.`,
          openGraph: {
            title: `${title} | The Braj Madhuri`,
            description: category.description || `Browse our collection of ${title}.`,
            images: category.thumbnailUrl ? [category.thumbnailUrl] : [],
            type: "website",
          },
          alternates: {
            canonical: `https://thebrajmadhuri.com/shop?category=${encodeURIComponent(categoryParam)}`,
          },
        };
      }
    } catch (e) {
      console.error("Failed to fetch category for metadata:", e);
    }
  }

  // Fallback default metadata
  return {
    title: "Shop Devotional Items | The Braj Madhuri",
    description: "Browse our complete collection of pooja fragrances, mala, poshak, and more devotional items.",
    openGraph: {
      type: "website",
    },
    alternates: {
      canonical: "https://thebrajmadhuri.com/shop",
    },
  };
}

export default async function Page({ searchParams }) {
  const resolvedParams = await searchParams;
  const categoryParam = resolvedParams?.category;
  
  let title = "Shop Devotional Items";
  let description = "Browse our complete collection of pooja fragrances, mala, poshak, and more devotional items.";
  let url = "https://thebrajmadhuri.com/shop";

  if (categoryParam) {
    const isSubcategory = categoryParam.includes("::");
    const catId = isSubcategory ? categoryParam.split("::")[0] : categoryParam;
    try {
      const prisma = getPrisma();
      const category = await prisma.category.findUnique({ where: { id: catId } });
      if (category) {
        title = isSubcategory ? `${categoryParam.split("::")[1]} - ${category.title}` : category.title;
        description = category.description || `Browse our collection of ${title}.`;
        url = `https://thebrajmadhuri.com/shop?category=${encodeURIComponent(categoryParam)}`;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": url
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <main className="page-loading" aria-busy="true">
            <p>Loading devotional collections...</p>
          </main>
        }
      >
        <ShopPage />
      </Suspense>
    </>
  );
}
