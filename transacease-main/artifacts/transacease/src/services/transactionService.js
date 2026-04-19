import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import { deductIngredients } from "./ingredientService";

const TRANSACTIONS_COLLECTION = "transactions";
const PRODUCTS_COLLECTION = "products";

const normalizeTransaction = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    totalAmount: Number(data.totalAmount ?? 0),
    subtotal: Number(data.subtotal ?? 0),
    discountAmount: Number(data.discountAmount ?? data.discountValue ?? 0),
    discountType: data.discountType ?? "none",
    status: data.status ?? "Completed",
    cashierEmail: data.cashierEmail ?? "",
    items: Array.isArray(data.items) ? data.items : [],
    createdAt: data.createdAt ?? null,
    source: data.source ?? "pos",
    queueNumber: data.queueNumber ?? null,
  };
};

const sortByCreatedAtDesc = (records) =>
  [...records].sort((a, b) => {
    const aSeconds = a.createdAt?.seconds ?? 0;
    const bSeconds = b.createdAt?.seconds ?? 0;
    return bSeconds - aSeconds;
  });

export const subscribeToTransactions = (callback, onError) => {
  if (!firebaseEnabled) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, TRANSACTIONS_COLLECTION),
    (snapshot) => {
      const transactions = sortByCreatedAtDesc(
        snapshot.docs.map(normalizeTransaction),
      );
      callback(transactions);
    },
    onError,
  );
};

export const updateTransactionStatus = async (transactionId, status) => {
  if (!firebaseEnabled) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId), { status });
};

export const checkoutTransaction = async ({
  cartItems,
  cashier,
  subtotal,
  discountAmount,
  totalAmount,
  discountType,
  promoValue,
}) => {
  if (!firebaseEnabled)
    throw new Error("Firebase is not configured. Checkout is unavailable.");
  if (!cashier?.uid) throw new Error("You must be logged in to checkout.");
  if (!Array.isArray(cartItems) || cartItems.length === 0)
    throw new Error("Cart is empty.");

  const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));

  await runTransaction(db, async (firestoreTransaction) => {
    const productSnapshots = await Promise.all(
      cartItems.map(async (item) => {
        const productRef = doc(db, PRODUCTS_COLLECTION, item.id);
        const snapshot = await firestoreTransaction.get(productRef);
        if (!snapshot.exists())
          throw new Error(`${item.name} no longer exists in inventory.`);
        const currentStock = Number(snapshot.data().stock ?? 0);
        if (currentStock < item.quantity)
          throw new Error(`Insufficient stock for ${item.name}.`);
        return { item, productRef, currentStock };
      }),
    );

    productSnapshots.forEach(({ item, productRef, currentStock }) => {
      firestoreTransaction.update(productRef, {
        stock: currentStock - item.quantity,
        updatedAt: serverTimestamp(),
      });
    });

    firestoreTransaction.set(transactionRef, {
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category ?? "",
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 0),
      })),
      subtotal: Number(subtotal ?? 0),
      discountAmount: Number(discountAmount ?? 0),
      discountType: discountType ?? "none",
      promoValue: Number(promoValue ?? 0),
      totalAmount: Number(totalAmount ?? 0),
      status: "Completed",
      cashierUid: cashier.uid,
      cashierEmail: cashier.email ?? "",
      source: "pos",
      createdAt: serverTimestamp(),
    });
  });

  return transactionRef;
};

export const kioskCheckoutTransaction = async ({
  cartItems,
  subtotal,
  totalAmount,
  productIngredientsMap,
}) => {
  if (!firebaseEnabled)
    throw new Error("Firebase is not configured. Checkout is unavailable.");
  if (!Array.isArray(cartItems) || cartItems.length === 0)
    throw new Error("Cart is empty.");

  const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
  const queueNumber = Math.floor(Math.random() * 999) + 1;

  await runTransaction(db, async (firestoreTransaction) => {
    await deductIngredients(
      firestoreTransaction,
      cartItems,
      productIngredientsMap,
    );

    firestoreTransaction.set(transactionRef, {
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category ?? "",
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 0),
      })),
      subtotal: Number(subtotal ?? 0),
      discountAmount: 0,
      discountType: "none",
      promoValue: 0,
      totalAmount: Number(totalAmount ?? 0),
      status: "Pending",
      cashierUid: "kiosk",
      cashierEmail: "kiosk@self-service",
      source: "kiosk",
      queueNumber,
      createdAt: serverTimestamp(),
    });
  });

  return { transactionRef, queueNumber };
};
