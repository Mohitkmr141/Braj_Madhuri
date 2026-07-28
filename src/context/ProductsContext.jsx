"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ProductsContext = createContext({
  categories: [],
  isLoaded: false,
});

export function ProductsProvider({ children, initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isLoaded, setIsLoaded] = useState(initialCategories.length > 0);

  // If initialCategories is empty, fallback to client fetch
  useEffect(() => {
    if (initialCategories.length === 0) {
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
  }, [initialCategories]);

  return (
    <ProductsContext.Provider value={{ categories, isLoaded }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
