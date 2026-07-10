import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <span className="section-eyebrow">Page Not Found</span>
          <h1 className="page-hero__title">Return to devotional collections.</h1>
          <p className="page-hero__body">
            The page you requested is not available. Continue browsing the
            catalog from the homepage.
          </p>
          <Link className="btn-primary" href="/">
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
