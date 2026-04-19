import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";

const DISCOUNTS_COLLECTION = "discounts";

const normalizeDiscount = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    code: data.code ?? "",
    type: data.type ?? "percentage",
    value: Number(data.value ?? 0),
    minOrderAmount: Number(data.minOrderAmount ?? 0),
    maxUsage: Number(data.maxUsage ?? 0),
    usageCount: Number(data.usageCount ?? 0),
    expiresAt: data.expiresAt ?? null,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt ?? null,
  };
};

export const subscribeToDiscounts = (callback, onError) => {
  if (!firebaseEnabled) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, DISCOUNTS_COLLECTION),
    (snapshot) => callback(snapshot.docs.map(normalizeDiscount)),
    onError,
  );
};

export const addDiscount = async (data) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  await addDoc(collection(db, DISCOUNTS_COLLECTION), {
    ...data,
    usageCount: 0,
    createdAt: serverTimestamp(),
  });
};

export const updateDiscount = async (id, data) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, DISCOUNTS_COLLECTION, id), data);
};

export const deleteDiscount = async (id) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  await deleteDoc(doc(db, DISCOUNTS_COLLECTION, id));
};
