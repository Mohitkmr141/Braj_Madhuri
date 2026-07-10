"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Header from "../components/Header.jsx";
import Newsletter from "../components/Newsletter.jsx";
import Footer from "../components/Footer.jsx";
import FloatingCart from "../components/FloatingCart.jsx";
import { CartProvider } from "../context/CartContext.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const addToCart = useCallback((price = 250) => {
    setCartCount((previous) => previous + 1);
    setCartTotal((previous) => previous + price);
  }, []);

  const cartAnnouncement = useMemo(() => {
    if (cartCount === 0) {
      return "Cart is empty.";
    }

    return `${cartCount} item${cartCount === 1 ? "" : "s"} in cart totaling INR ${cartTotal.toLocaleString("en-IN")}.`;
  }, [cartCount, cartTotal]);

  const contextValue = useMemo(
    () => ({
      addToCart,
      cartCount,
      cartTotal,
    }),
    [addToCart, cartCount, cartTotal],
  );

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
  }, [pathname]);

  return (
    <AuthProvider>
      <CartProvider value={contextValue}>
        <p className="visually-hidden" aria-live="polite">
          {cartAnnouncement}
        </p>
        <Header cartCount={cartCount} cartTotal={cartTotal} />
        {children}
        <Newsletter />
        <Footer />
        <FloatingCart cartCount={cartCount} cartTotal={cartTotal} />
      </CartProvider>
    </AuthProvider>
  );
}
