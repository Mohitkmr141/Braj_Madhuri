"use client";

import { createContext, useContext } from "react";

const CartContext = createContext({
  cartItems: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  cartCount: 0,
  cartTotal: 0,
});

export function CartProvider({ children, value }) {
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
