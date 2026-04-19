import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";

const INGREDIENTS_COLLECTION = "ingredients";
const PRODUCT_INGREDIENTS_COLLECTION = "product_ingredients";

const normalizeIngredient = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? "",
    quantity: Number(data.quantity ?? 0),
    unit: data.unit ?? "pcs",
    lowStockThreshold: Number(data.lowStockThreshold ?? 5),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
};

export const subscribeToIngredients = (callback, onError) => {
  if (!firebaseEnabled) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, INGREDIENTS_COLLECTION),
    (snapshot) => {
      const ingredients = snapshot.docs
        .map(normalizeIngredient)
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(ingredients);
    },
    onError,
  );
};

export const addIngredient = async (ingredient) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  await addDoc(collection(db, INGREDIENTS_COLLECTION), {
    ...ingredient,
    quantity: Number(ingredient.quantity ?? 0),
    lowStockThreshold: Number(ingredient.lowStockThreshold ?? 5),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateIngredient = async (id, updates) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, INGREDIENTS_COLLECTION, id), {
    ...updates,
    quantity: Number(updates.quantity ?? 0),
    lowStockThreshold: Number(updates.lowStockThreshold ?? 5),
    updatedAt: serverTimestamp(),
  });
};

export const deleteIngredient = async (id) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  await deleteDoc(doc(db, INGREDIENTS_COLLECTION, id));
};

export const restockIngredient = async (id, amount) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  const qty = Number(amount);
  if (!Number.isFinite(qty) || qty <= 0)
    throw new Error("Amount must be greater than zero.");
  await updateDoc(doc(db, INGREDIENTS_COLLECTION, id), {
    quantity: increment(qty),
    updatedAt: serverTimestamp(),
  });
};

export const setProductIngredients = async (productId, ingredients) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  await setDoc(doc(db, PRODUCT_INGREDIENTS_COLLECTION, productId), {
    ingredients,
    updatedAt: serverTimestamp(),
  });
};

export const subscribeToAllProductIngredients = (callback, onError) => {
  if (!firebaseEnabled) {
    callback({});
    return () => {};
  }
  return onSnapshot(
    collection(db, PRODUCT_INGREDIENTS_COLLECTION),
    (snapshot) => {
      const map = {};
      snapshot.docs.forEach((d) => {
        map[d.id] = d.data().ingredients ?? [];
      });
      callback(map);
    },
    onError,
  );
};

export const deductIngredients = async (
  firestoreTransaction,
  cartItems,
  productIngredientsMap,
) => {
  const deductions = {};
  for (const item of cartItems) {
    const reqs = productIngredientsMap[item.id] ?? [];
    for (const req of reqs) {
      if (!deductions[req.ingredientId]) deductions[req.ingredientId] = 0;
      deductions[req.ingredientId] += req.requiredQuantity * item.quantity;
    }
  }
  for (const [ingredientId, amount] of Object.entries(deductions)) {
    const ref = doc(db, INGREDIENTS_COLLECTION, ingredientId);
    const snap = await firestoreTransaction.get(ref);
    if (!snap.exists()) continue;
    const current = Number(snap.data().quantity ?? 0);
    firestoreTransaction.update(ref, {
      quantity: Math.max(0, current - amount),
      updatedAt: serverTimestamp(),
    });
  }
};
