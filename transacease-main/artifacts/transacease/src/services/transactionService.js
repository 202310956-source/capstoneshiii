import { supabase, supabaseEnabled } from "./supabase";
import { deductIngredients } from "./ingredientService";

const normalizeTransaction = (row) => ({
  id: row.id,
  totalAmount: Number(row.total_amount ?? 0),
  subtotal: Number(row.subtotal ?? 0),
  discountAmount: Number(row.discount_amount ?? 0),
  discountType: row.discount_type ?? "none",
  status: row.status ?? "Completed",
  cashierEmail: row.cashier_email ?? "",
  items: Array.isArray(row.transaction_items)
    ? row.transaction_items.map((i) => ({
        id: i.product_id,
        name: i.name,
        category: i.category ?? "",
        price: Number(i.price ?? 0),
        quantity: Number(i.quantity ?? 0),
      }))
    : [],
  createdAt: row.created_at ?? null,
  source: row.source ?? "pos",
  queueNumber: row.queue_number ?? null,
});

const sortByCreatedAtDesc = (records) =>
  [...records].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

export const subscribeToTransactions = (callback, onError) => {
  if (!supabaseEnabled) {
    callback([]);
    return () => {};
  }

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, transaction_items(*)")
      .order("created_at", { ascending: false });
    if (error) { onError(error); return; }
    callback(sortByCreatedAtDesc(data.map(normalizeTransaction)));
  };

  fetchAll();

  const subscription = supabase
    .channel("transactions-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchAll)
    .subscribe();

  return () => supabase.removeChannel(subscription);
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
  if (!supabaseEnabled)
    throw new Error("Supabase is not configured. Checkout is unavailable.");
  if (!cashier?.uid) throw new Error("You must be logged in to checkout.");
  if (!Array.isArray(cartItems) || cartItems.length === 0)
    throw new Error("Cart is empty.");

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      subtotal: Number(subtotal ?? 0),
      discount_amount: Number(discountAmount ?? 0),
      discount_type: discountType ?? "none",
      promo_value: Number(promoValue ?? 0),
      total_amount: Number(totalAmount ?? 0),
      status: "Completed",
      cashier_uid: cashier.uid,
      cashier_email: cashier.email ?? "",
      source: "pos",
    })
    .select()
    .single();

  if (txnError) throw new Error(txnError.message);

  const itemRows = cartItems.map((item) => ({
    transaction_id: txn.id,
    product_id: item.id,
    name: item.name,
    category: item.category ?? "",
    price: Number(item.price ?? 0),
    quantity: Number(item.quantity ?? 0),
  }));

  const { error: itemsError } = await supabase
    .from("transaction_items")
    .insert(itemRows);

  if (itemsError) throw new Error(itemsError.message);

  // Deduct product stock
  for (const item of cartItems) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .single();
    if (!product) continue;
    if (Number(product.stock) < item.quantity)
      throw new Error(`Insufficient stock for ${item.name}.`);
    await supabase.from("products").update({
      stock: Number(product.stock) - item.quantity,
      updated_at: new Date().toISOString(),
    }).eq("id", item.id);
  }

  return txn;
};

export const kioskCheckoutTransaction = async ({
  cartItems,
  subtotal,
  totalAmount,
  productIngredientsMap,
}) => {
  if (!supabaseEnabled)
    throw new Error("Supabase is not configured. Checkout is unavailable.");
  if (!Array.isArray(cartItems) || cartItems.length === 0)
    throw new Error("Cart is empty.");

  const queueNumber = Math.floor(Math.random() * 999) + 1;

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .insert({
      subtotal: Number(subtotal ?? 0),
      discount_amount: 0,
      discount_type: "none",
      promo_value: 0,
      total_amount: Number(totalAmount ?? 0),
      status: "Pending",
      cashier_uid: "kiosk",
      cashier_email: "kiosk@self-service",
      source: "kiosk",
      queue_number: queueNumber,
    })
    .select()
    .single();

  if (txnError) throw new Error(txnError.message);

  const itemRows = cartItems.map((item) => ({
    transaction_id: txn.id,
    product_id: item.id,
    name: item.name,
    category: item.category ?? "",
    price: Number(item.price ?? 0),
    quantity: Number(item.quantity ?? 0),
  }));

  await supabase.from("transaction_items").insert(itemRows);

  // Deduct ingredients
  await deductIngredients(cartItems, productIngredientsMap);

  return { transactionRef: txn, queueNumber };
};
