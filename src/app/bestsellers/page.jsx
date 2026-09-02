import { Suspense } from "react";
import BestsellersPage from "../../views/BestsellersPage.jsx";

export const metadata = {
  title: "Bestsellers | The Braj Madhuri",
  description: "Explore the most loved and trending devotional items from our store.",
  openGraph: {
    title: "Bestsellers | The Braj Madhuri",
    description: "Explore the most loved and trending devotional items from our store.",
    type: "website",
  },
  alternates: {
    canonical: "https://thebrajmadhuri.com/bestsellers",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Bestsellers | The Braj Madhuri",
    "description": "Explore the most loved and trending devotional items from our store.",
    "url": "https://thebrajmadhuri.com/bestsellers"
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
            <p>Loading bestsellers...</p>
          </main>
        }
      >
        <BestsellersPage />
      </Suspense>
    </>
  );
}
