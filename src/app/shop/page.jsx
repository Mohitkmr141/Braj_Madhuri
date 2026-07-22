import { Suspense } from "react";
import ShopPage from "../../views/ShopPage.jsx";

export const metadata = {
  title: "Shop Devotional Items",
  description: "Browse our complete collection of pooja fragrances, mala, poshak, and more devotional items.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="page-loading" aria-busy="true">
          <p>Loading devotional collections...</p>
        </main>
      }
    >
      <ShopPage />
    </Suspense>
  );
}
