"use client";

import { createContext, useContext } from "react";

const WishlistContext = createContext({
  wishlistItems: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isInWishlist: () => false,
  wishlistCount: 0,
});

export function WishlistProvider({ children, value }) {
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
