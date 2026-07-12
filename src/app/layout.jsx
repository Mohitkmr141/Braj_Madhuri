import { Suspense } from "react";
import SiteShell from "./SiteShell.jsx";
import "../App.css";

export const metadata = {
  title: {
    default: "The Braj Madhuri",
    template: "%s | The Braj Madhuri",
  },
  description:
    "Devotional essentials, pooja fragrances, poshak, mala, dhoop, and seva products from The Braj Madhuri.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body>
        <Suspense fallback={null}>
          <SiteShell>{children}</SiteShell>
        </Suspense>
      </body>
    </html>
  );
}
