"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import FloatingCart from "../components/FloatingCart.jsx";
import FloatingWhatsApp from "../components/FloatingWhatsApp.jsx";
import SaleModalBanner from "../components/SaleModalBanner.jsx";
import { CartProvider } from "../context/CartContext.jsx";
import { SessionProvider } from "next-auth/react";
import { WishlistProvider } from "../context/WishlistContext.jsx";
import { ProductsProvider } from "../context/ProductsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function SiteShell({ children, initialCategories }) {
  const pathname = usePathname();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    try {
      const stored = localStorage.getItem("bm_cart_items");
      if (stored) setCartItems(JSON.parse(stored));
      
      const storedWishlist = localStorage.getItem("bm_wishlist_items");
      if (storedWishlist) setWishlistItems(JSON.parse(storedWishlist));
    } catch (e) {
      console.error("Failed to load cart/wishlist", e);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("bm_cart_items", JSON.stringify(cartItems));
      localStorage.setItem("bm_wishlist_items", JSON.stringify(wishlistItems));
    }
  }, [cartItems, wishlistItems, isClient]);

  // Helper to normalize and compare cart/wishlist items consistently
  const isItemMatch = (item, id, size, color) => {
    const normSizeA = item.size ? String(item.size).trim() : null;
    const normSizeB = size ? String(size).trim() : null;
    const normColorA = item.color ? String(item.color).trim() : null;
    const normColorB = color ? String(color).trim() : null;

    return item.id === id && normSizeA === normSizeB && (color === undefined || normColorA === normColorB);
  };

  const addToCart = useCallback((product) => {
    setCartItems((prev) => {
      if (typeof product === 'number') {
        product = { id: `legacy-${Date.now()}`, title: 'Item', price: product, image: '', originalPrice: null, maxStock: 9999 };
      }
      
      const availableStock = typeof product.maxStock === 'number' 
        ? product.maxStock 
        : (typeof product.stock === 'number' ? product.stock : 9999);

      const existing = prev.find((item) => isItemMatch(item, product.id, product.size, product.color));
      
      if (existing) {
        const itemMax = typeof existing.maxStock === 'number' ? existing.maxStock : availableStock;
        if (existing.quantity >= itemMax) {
          addToast(`Only ${itemMax} unit${itemMax === 1 ? '' : 's'} available in stock`);
          return prev;
        }

        addToast(`Increased quantity of ${product.title || 'Item'}`);
        return prev.map((item) =>
          isItemMatch(item, product.id, product.size, product.color)
            ? { ...item, quantity: item.quantity + 1, maxStock: itemMax }
            : item
        );
      }

      if (availableStock <= 0) {
        addToast(`${product.title || 'Item'} is currently out of stock`);
        return prev;
      }

      addToast(`${product.title || 'Item'} added to cart!`);
      return [...prev, { ...product, maxStock: availableStock, quantity: 1 }];
    });
  }, [addToast]);

  const updateQuantity = useCallback((id, size, quantity, color) => {
    setCartItems((prev) => {
      if (quantity < 1) {
        return prev.filter((item) => !isItemMatch(item, id, size, color));
      }

      const target = prev.find((item) => isItemMatch(item, id, size, color));
      const itemMax = target && typeof target.maxStock === 'number' ? target.maxStock : 9999;

      let finalQty = quantity;
      if (finalQty > itemMax) {
        finalQty = Math.max(1, itemMax);
        addToast(`Maximum available stock (${itemMax}) reached`);
      }

      return prev.map((item) =>
        isItemMatch(item, id, size, color) ? { ...item, quantity: finalQty, maxStock: itemMax } : item
      );
    });
  }, [addToast]);

  const removeFromCart = useCallback((id, size, color) => {
    setCartItems((prev) => prev.filter((item) => !isItemMatch(item, id, size, color)));
  }, []);

  const emptyCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0), [cartItems]);

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

  const addToWishlist = useCallback((product) => {
    setWishlistItems((prev) => {
      const existing = prev.find((item) => isItemMatch(item, product.id, product.size, product.color));
      if (existing) return prev;
      addToast(`${product.title || 'Item'} added to wishlist!`);
      return [...prev, product];
    });
  }, [addToast]);

  const removeFromWishlist = useCallback((productId, size, color) => {
    setWishlistItems((prev) => {
      const item = prev.find(i => isItemMatch(i, productId, size, color));
      if (item) addToast(`${item.title || 'Item'} removed from wishlist`, 'error');
      return prev.filter((item) => !isItemMatch(item, productId, size, color));
    });
  }, [addToast]);

  const isInWishlist = useCallback((id, size, color) => {
    return wishlistItems.some((item) => isItemMatch(item, id, size, color));
  }, [wishlistItems]);

  const wishlistCount = useMemo(() => wishlistItems.length, [wishlistItems]);

  const wishlistContextValue = useMemo(
    () => ({
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      wishlistCount,
    }),
    [wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, wishlistCount]
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

    // Give the DOM a tiny bit of time to render dynamic content before attaching observer
    const initTimer = setTimeout(() => {
      document.querySelectorAll(".reveal").forEach(observeElement);
    }, 150);

    return () => {
      clearTimeout(initTimer);
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname]);

  const isAdminRoute = pathname?.startsWith('/admin');
  const isCheckoutRoute = pathname === '/checkout';

  return (
    <SessionProvider>
      <ProductsProvider initialCategories={initialCategories}>
        <CartProvider value={contextValue}>
          <WishlistProvider value={wishlistContextValue}>
            {!isAdminRoute && !isCheckoutRoute && (
              <>
                <p className="visually-hidden" aria-live="polite">
                  {cartAnnouncement}
                </p>
                <Header cartCount={cartCount} cartTotal={cartTotal} wishlistCount={wishlistCount} />
              </>
            )}
            {children}
            {!isAdminRoute && !isCheckoutRoute && (
              <>
                <Footer />
                {pathname !== '/cart' && <FloatingCart cartCount={cartCount} cartTotal={cartTotal} />}
                <FloatingWhatsApp />
                <SaleModalBanner />
              </>
            )}
          </WishlistProvider>
        </CartProvider>
      </ProductsProvider>
    </SessionProvider>
  );
}
