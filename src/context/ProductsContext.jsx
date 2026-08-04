"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ProductsContext = createContext({
  categories: [],
  isLoaded: false,
});

export function ProductsProvider({ children, initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isLoaded, setIsLoaded] = useState(initialCategories.length > 0);

  const hasFetched = React.useRef(false);

  // If initialCategories is empty, fallback to client fetch
  useEffect(() => {
    if (initialCategories.length === 0) {
      // Guard: only fetch once, not on every render
      if (hasFetched.current) return;
      hasFetched.current = true;
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.categories) {
            setCategories(data.categories);
          }
          setIsLoaded(true);
        })
        .catch(err => {
          console.error("ProductsContext: Failed to fetch products", err);
          setIsLoaded(true);
        });
    } else {
      setCategories(initialCategories);
      setIsLoaded(true);
    }
  // Only re-run if the length changes (avoid reacting to new array reference)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategories.length]);

  return (
    <ProductsContext.Provider value={{ categories, isLoaded }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
