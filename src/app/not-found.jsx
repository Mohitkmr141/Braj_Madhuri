import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <span className="section-eyebrow">404 Error</span>
          <h1 className="page-hero__title">Page Not Found</h1>
          <p className="page-hero__body">
            The page you requested is not available. Continue browsing our
            devotional collections from the homepage.
          </p>
          <Link className="btn-primary" href="/">
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
