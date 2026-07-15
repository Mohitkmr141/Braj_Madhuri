"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import FloatingCart from "../components/FloatingCart.jsx";
import { CartProvider } from "../context/CartContext.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem("bm_cart_items");
      if (stored) setCartItems(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load cart", e);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("bm_cart_items", JSON.stringify(cartItems));
    }
  }, [cartItems, isClient]);

  const addToCart = useCallback((product) => {
    setCartItems((prev) => {
      // Fallback if price is somehow passed instead of object (e.g. from an old component we missed)
      if (typeof product === 'number') {
        product = { id: `legacy-${Date.now()}`, title: 'Item', price: product, image: '', originalPrice: null };
      }
      
      const existing = prev.find((item) => item.id === product.id && item.size === product.size);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === product.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id, size, quantity) => {
    setCartItems((prev) =>
      quantity < 1
        ? prev.filter((item) => !(item.id === id && item.size === size))
        : prev.map((item) =>
            item.id === id && item.size === size ? { ...item, quantity } : item
          )
    );
  }, []);

  const removeFromCart = useCallback((id, size) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
  }, []);

  const emptyCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((acc, item) => acc + ((item.price || 250) * item.quantity), 0), [cartItems]);

  const cartAnnouncement = useMemo(() => {
    if (cartCount === 0) {
      return "Cart is empty.";
    }

    return `${cartCount} item${cartCount === 1 ? "" : "s"} in cart totaling INR ${cartTotal.toLocaleString("en-IN")}.`;
  }, [cartCount, cartTotal]);

  const contextValue = useMemo(
    () => ({
      cartItems,
      cartCount,
      cartTotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      emptyCart,
    }),
    [cartItems, cartCount, cartTotal, addToCart, updateQuantity, removeFromCart, emptyCart]
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const timers = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const timer = window.setTimeout(() => {
              entry.target.classList.add("visible");
            }, index * 80);
            timers.add(timer);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    const observeElement = (el) => {
      if (prefersReducedMotion) {
        el.classList.add("visible");
      } else if (!el.classList.contains("visible")) {
        observer.observe(el);
      }
    };

    // Initial observation
    document.querySelectorAll(".reveal").forEach(observeElement);

    // Watch for dynamic additions
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            if (node.classList.contains("reveal")) {
              observeElement(node);
            }
            // Find nested .reveal elements
            const nestedReveals = node.querySelectorAll(".reveal");
            nestedReveals.forEach(observeElement);
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname, searchParams]);

  return (
    <AuthProvider>
      <CartProvider value={contextValue}>
        <p className="visually-hidden" aria-live="polite">
          {cartAnnouncement}
        </p>
        <Header cartCount={cartCount} cartTotal={cartTotal} />
        {children}
        <Footer />
        <FloatingCart cartCount={cartCount} cartTotal={cartTotal} />
      </CartProvider>
    </AuthProvider>
  );
}
