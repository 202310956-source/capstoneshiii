import { supabase, supabaseEnabled } from "./supabase";

const normalizeIngredient = (row) => ({
  id: row.id,
  name: row.name ?? "",
  quantity: Number(row.quantity ?? 0),
  unit: row.unit ?? "pcs",
  lowStockThreshold: Number(row.low_stock_threshold ?? 5),
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

export const subscribeToIngredients = (callback, onError) => {
  if (!supabaseEnabled) {
    callback([]);
    return () => {};
  }

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");
    if (error) { onError(error); return; }
    callback(data.map(normalizeIngredient));
  };

  fetchAll();

  const subscription = supabase
    .channel("ingredients-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, fetchAll)
    .subscribe();

  return () => supabase.removeChannel(subscription);
};

export const addIngredient = async (ingredient) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("ingredients").insert({
    name: ingredient.name,
    quantity: Number(ingredient.quantity ?? 0),
    unit: ingredient.unit ?? "pcs",
    low_stock_threshold: Number(ingredient.lowStockThreshold ?? 5),
  });
  if (error) throw new Error(error.message);
};

export const updateIngredient = async (id, updates) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("ingredients").update({
    name: updates.name,
    quantity: Number(updates.quantity ?? 0),
    unit: updates.unit ?? "pcs",
    low_stock_threshold: Number(updates.lowStockThreshold ?? 5),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error(error.message);
};

export const deleteIngredient = async (id) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

export const restockIngredient = async (id, amount) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  const qty = Number(amount);
  if (!Number.isFinite(qty) || qty <= 0)
    throw new Error("Amount must be greater than zero.");
  const { data, error: fetchError } = await supabase
    .from("ingredients")
    .select("quantity")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  const { error } = await supabase.from("ingredients").update({
    quantity: Number(data.quantity ?? 0) + qty,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error(error.message);
};

export const setProductIngredients = async (productId, ingredients) => {
  if (!supabaseEnabled) throw new Error("Supabase is not configured.");
  // Delete existing links first
  await supabase.from("product_ingredients").delete().eq("product_id", productId);
  if (ingredients.length === 0) return;
  const rows = ingredients
    .filter((r) => r.ingredientId)
    .map((r) => ({
      product_id: productId,
      ingredient_id: r.ingredientId,
      required_quantity: Number(r.requiredQuantity ?? 1),
    }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("product_ingredients").insert(rows);
  if (error) throw new Error(error.message);
};

export const subscribeToAllProductIngredients = (callback, onError) => {
  if (!supabaseEnabled) {
    callback({});
    return () => {};
  }

  const buildMap = (rows) => {
    const map = {};
    rows.forEach((row) => {
      if (!map[row.product_id]) map[row.product_id] = [];
      map[row.product_id].push({
        ingredientId: row.ingredient_id,
        requiredQuantity: Number(row.required_quantity ?? 1),
      });
    });
    return map;
  };

  const fetchAll = async () => {
    const { data, error } = await supabase.from("product_ingredients").select("*");
    if (error) { onError(error); return; }
    callback(buildMap(data));
  };

  fetchAll();

  const subscription = supabase
    .channel("product-ingredients-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "product_ingredients" }, fetchAll)
    .subscribe();

  return () => supabase.removeChannel(subscription);
};

export const deductIngredients = async (cartItems, productIngredientsMap) => {
  const deductions = {};
  for (const item of cartItems) {
    const reqs = productIngredientsMap[item.id] ?? [];
    for (const req of reqs) {
      if (!deductions[req.ingredientId]) deductions[req.ingredientId] = 0;
      deductions[req.ingredientId] += req.requiredQuantity * item.quantity;
    }
  }
  for (const [ingredientId, amount] of Object.entries(deductions)) {
    const { data } = await supabase
      .from("ingredients")
      .select("quantity")
      .eq("id", ingredientId)
      .single();
    if (!data) continue;
    await supabase.from("ingredients").update({
      quantity: Math.max(0, Number(data.quantity ?? 0) - amount),
      updated_at: new Date().toISOString(),
    }).eq("id", ingredientId);
  }
};
