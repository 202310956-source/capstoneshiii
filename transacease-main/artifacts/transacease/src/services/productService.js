import { supabase, supabaseEnabled } from "./supabase";

const normalizeProduct = (row) => ({
  id: row.id,
  name: row.name ?? "",
  category: row.category ?? "Uncategorized",
  price: Number(row.price ?? 0),
  stock: Number(row.stock ?? 0),
  reorderLevel: Number(row.reorder_level ?? 0),
  sku: row.sku ?? "",
  image: row.image ?? "",
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

export const subscribeToProducts = (callback, onError) => {
  if (!supabaseEnabled) {
    callback([]);
    return () => {};
  }

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (error) { onError(error); return; }
    callback(data.map(normalizeProduct));
  };

  fetchAll();

  const subscription = supabase
    .channel("products-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchAll)
    .subscribe();

  return () => supabase.removeChannel(subscription);
};

export const addProduct = async (product) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("products").insert({
    name: product.name,
    category: product.category ?? "Uncategorized",
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? 0),
    reorder_level: Number(product.reorderLevel ?? 0),
    sku: product.sku ?? "",
    image: product.image ?? "",
  });
  if (error) throw new Error(error.message);
};

export const updateProduct = async (productId, updates) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("products").update({
    name: updates.name,
    category: updates.category ?? "Uncategorized",
    price: Number(updates.price ?? 0),
    stock: Number(updates.stock ?? 0),
    reorder_level: Number(updates.reorderLevel ?? 0),
    sku: updates.sku ?? "",
    image: updates.image ?? "",
    updated_at: new Date().toISOString(),
  }).eq("id", productId);
  if (error) throw new Error(error.message);
};

export const deleteProduct = async (productId) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
};

export const restockProduct = async (productId, quantity) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  const amount = Number(quantity);
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Restock quantity must be greater than zero.");
  const { data, error: fetchError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  const { error } = await supabase.from("products").update({
    stock: Number(data.stock ?? 0) + amount,
    updated_at: new Date().toISOString(),
  }).eq("id", productId);
  if (error) throw new Error(error.message);
};
