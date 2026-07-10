import { Suspense } from "react";
import ShopPage from "../../pages/ShopPage.jsx";

export const metadata = {
  title: "Shop",
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
