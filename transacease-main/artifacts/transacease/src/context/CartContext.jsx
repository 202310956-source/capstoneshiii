import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [discountType, setDiscountType] = useState(null);
  const [promo, setPromo] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!discountType) return 0;
    if (discountType === "senior" || discountType === "pwd") return subtotal * 0.2;
    if (discountType === "promo") return subtotal * (promo / 100);
    return 0;
  }, [discountType, promo, subtotal]);

  const totalAmount = useMemo(() => {
    return Math.max(subtotal - discountAmount, 0);
  }, [subtotal, discountAmount]);

  useEffect(() => {
    if (discountType !== "promo") {
      setPromo(0);
    }
  }, [discountType]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCartItems((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountType(null);
    setPromo(0);
  };

  const checkout = async () => {
    if (!user) throw new Error("You must be logged in to checkout.");
    if (!cartItems.length) throw new Error("Cart is empty.");

    setIsLoading(true);
    setError(null);

    try {
      const transactionPayload = {
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount,
        subtotal,
        discountType: discountType || "none",
        discountValue: discountAmount,
        cashierId: user.uid,
        cashierEmail: user.email,
        createdAt: serverTimestamp(),
      };

      const txRef = await addDoc(collection(db, "transactions"), transactionPayload);

      // Deduct inventory stock
      const batch = writeBatch(db);
      for (let product of cartItems) {
        const productRef = doc(db, "products", product.id);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          throw new Error(`Product ${product.name} not found in inventory.`);
        }
        const currentStock = productSnap.data().stock || 0;
        if (currentStock < product.quantity) {
          throw new Error(`Insufficient stock for ${product.name}.`);
        }
        batch.update(productRef, { stock: currentStock - product.quantity });
      }
      await batch.commit();

      clearCart();
      return txRef;
    } catch (err) {
      setError(err.message || "Checkout failed.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cartItems,
    discountType,
    promo,
    subtotal,
    discountAmount,
    totalAmount,
    isLoading,
    error,
    setDiscountType,
    setPromo,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
