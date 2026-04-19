import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";

const PRODUCTS_COLLECTION = "products";

const normalizeProduct = (snapshot) => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: data.name ?? "",
    category: data.category ?? "Uncategorized",
    price: Number(data.price ?? 0),
    stock: Number(data.stock ?? 0),
    reorderLevel: Number(data.reorderLevel ?? 0),
    sku: data.sku ?? "",
    image: data.image ?? "",
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
};

export const subscribeToProducts = (callback, onError) => {
  if (!firebaseEnabled) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, PRODUCTS_COLLECTION),
    (snapshot) => {
      const products = snapshot.docs.map(normalizeProduct).sort((a, b) => a.name.localeCompare(b.name));
      callback(products);
    },
    onError,
  );
};

export const addProduct = async (product) => {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured. Inventory is unavailable.");
  }

  await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...product,
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? 0),
    reorderLevel: Number(product.reorderLevel ?? 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateProduct = async (productId, updates) => {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured. Inventory is unavailable.");
  }

  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    ...updates,
    price: Number(updates.price ?? 0),
    stock: Number(updates.stock ?? 0),
    reorderLevel: Number(updates.reorderLevel ?? 0),
    updatedAt: serverTimestamp(),
  });
};

export const deleteProduct = async (productId) => {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured. Inventory is unavailable.");
  }

  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
};

export const restockProduct = async (productId, quantity) => {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured. Inventory is unavailable.");
  }

  const amount = Number(quantity);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Restock quantity must be greater than zero.");
  }

  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    stock: increment(amount),
    updatedAt: serverTimestamp(),
  });
};
