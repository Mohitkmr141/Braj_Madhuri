import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Newsletter from "./components/Newsletter.jsx";
import Footer from "./components/Footer.jsx";
import FloatingCart from "./components/FloatingCart.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const ShopPage = lazy(() => import("./pages/ShopPage.jsx"));
const CombosPage = lazy(() => import("./pages/CombosPage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));

function App() {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const addToCart = (price = 250) => {
    setCartCount((prev) => prev + 1);
    setCartTotal((prev) => prev + price);
  };

  const cartAnnouncement = useMemo(() => {
    if (cartCount === 0) {
      return "Cart is empty.";
    }

    return `${cartCount} item${cartCount === 1 ? "" : "s"} in cart totaling INR ${cartTotal.toLocaleString("en-IN")}.`;
  }, [cartCount, cartTotal]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    const revealTargets = [...document.querySelectorAll(".reveal")];
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      revealTargets.forEach((element) => element.classList.add("visible"));
      return undefined;
    }

    revealTargets.forEach((element) => element.classList.remove("visible"));

    const timers = [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const timer = window.setTimeout(() => {
              entry.target.classList.add("visible");
            }, index * 80);
            timers.push(timer);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    revealTargets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [location.pathname, location.search]);

  return (
    <>
      <p className="visually-hidden" aria-live="polite">
        {cartAnnouncement}
      </p>
      <Header cartCount={cartCount} cartTotal={cartTotal} />
      <Suspense
        fallback={
          <main className="page-loading" aria-busy="true">
            <p>Loading devotional collections...</p>
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage addToCart={addToCart} />} />
          <Route path="/shop" element={<ShopPage addToCart={addToCart} />} />
          <Route
            path="/combos"
            element={<CombosPage addToCart={addToCart} />}
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Suspense>
      <Newsletter />
      <Footer />
      <FloatingCart cartCount={cartCount} cartTotal={cartTotal} />
    </>
  );
}

export default App;
