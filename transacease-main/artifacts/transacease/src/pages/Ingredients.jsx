import React, { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import Sidebar from "../components/Sidebar";
import {
  addIngredient,
  deleteIngredient,
  restockIngredient,
  subscribeToIngredients,
  setProductIngredients,
  subscribeToAllProductIngredients,
  updateIngredient,
} from "../services/ingredientService";
import { subscribeToProducts } from "../services/productService";

const emptyIngredientForm = { name: "", quantity: "", unit: "pcs", lowStockThreshold: "5" };
const UNITS = ["pcs", "grams", "kg", "ml", "liters", "cups", "tbsp", "tsp"];

const stockBadge = (qty, threshold) => {
  if (qty === 0)
    return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Out of Stock</span>;
  if (qty <= threshold)
    return <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">Low Stock</span>;
  return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">In Stock</span>;
};

const Ingredients = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [productIngredientsMap, setProductIngredientsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyIngredientForm);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [restockTarget, setRestockTarget] = useState(null);
  const [restockAmount, setRestockAmount] = useState("");

  const [linkingProduct, setLinkingProduct] = useState(null);
  const [linkedIngredients, setLinkedIngredients] = useState([]);
  const [savingLink, setSavingLink] = useState(false);

  useEffect(() => {
    const unsubIngredients = subscribeToIngredients(
      (next) => { setIngredients(next); setLoading(false); },
      (err) => { setLoading(false); enqueueSnackbar(err.message || "Unable to load ingredients.", { variant: "error" }); },
    );
    const unsubProducts = subscribeToProducts(
      (next) => setProducts(next),
      (err) => enqueueSnackbar(err.message || "Unable to load products.", { variant: "error" }),
    );
    const unsubLinks = subscribeToAllProductIngredients(
      (map) => setProductIngredientsMap(map),
      (err) => enqueueSnackbar(err.message || "Unable to load product-ingredient links.", { variant: "error" }),
    );
    return () => { unsubIngredients(); unsubProducts(); unsubLinks(); };
  }, []);

  const resetForm = () => { setForm(emptyIngredientForm); setEditingIngredient(null); setShowModal(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        lowStockThreshold: Number(form.lowStockThreshold || 5),
      };
      if (!payload.name) throw new Error("Ingredient name is required.");
      if (editingIngredient) {
        await updateIngredient(editingIngredient.id, payload);
        enqueueSnackbar("Ingredient updated.", { variant: "success" });
      } else {
        await addIngredient(payload);
        enqueueSnackbar("Ingredient added.", { variant: "success" });
      }
      resetForm();
    } catch (err) {
      enqueueSnackbar(err.message || "Unable to save ingredient.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ingredient) => {
    if (!window.confirm(`Delete "${ingredient.name}"?`)) return;
    try {
      await deleteIngredient(ingredient.id);
      enqueueSnackbar("Ingredient deleted.", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message || "Unable to delete ingredient.", { variant: "error" });
    }
  };

  const handleRestock = async () => {
    try {
      await restockIngredient(restockTarget.id, restockAmount);
      enqueueSnackbar(`Restocked ${restockTarget.name}.`, { variant: "success" });
      setRestockTarget(null);
      setRestockAmount("");
    } catch (err) {
      enqueueSnackbar(err.message || "Unable to restock.", { variant: "error" });
    }
  };

  const openLinkModal = (product) => {
    const existing = productIngredientsMap[product.id] ?? [];
    setLinkingProduct(product);
    setLinkedIngredients(existing.map((e) => ({ ...e })));
  };

  const addIngredientRow = () => {
    setLinkedIngredients((prev) => [...prev, { ingredientId: "", requiredQuantity: 1 }]);
  };

  const updateIngredientRow = (index, field, value) => {
    setLinkedIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const removeIngredientRow = (index) => {
    setLinkedIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveLink = async () => {
    setSavingLink(true);
    try {
      const valid = linkedIngredients.filter((r) => r.ingredientId);
      await setProductIngredients(linkingProduct.id, valid);
      enqueueSnackbar(`Ingredients linked to ${linkingProduct.name}.`, { variant: "success" });
      setLinkingProduct(null);
    } catch (err) {
      enqueueSnackbar(err.message || "Unable to save links.", { variant: "error" });
    } finally {
      setSavingLink(false);
    }
  };

  const lowCount = useMemo(
    () => ingredients.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length,
    [ingredients],
  );
  const outCount = useMemo(() => ingredients.filter((i) => i.quantity === 0).length, [ingredients]);

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#333333]">
      <div className="flex">
        <Sidebar active="Ingredients" />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold font-poppins">Ingredients</h1>
              <p className="text-sm text-gray-600">Manage raw ingredients and link them to menu products.</p>
            </div>
            <button
              onClick={() => { setEditingIngredient(null); setForm(emptyIngredientForm); setShowModal(true); }}
              className="rounded-xl bg-[#FFD23F] px-4 py-2 font-semibold text-[#333333] hover:bg-[#ffcf3f]"
            >
              + Add Ingredient
            </button>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white p-4 shadow text-center">
              <p className="text-2xl font-bold text-[#333333]">{ingredients.length}</p>
              <p className="text-sm text-gray-500">Total Ingredients</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-4 shadow text-center">
              <p className="text-2xl font-bold text-orange-600">{lowCount}</p>
              <p className="text-sm text-orange-500">Low Stock</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 shadow text-center">
              <p className="text-2xl font-bold text-red-600">{outCount}</p>
              <p className="text-sm text-red-500">Out of Stock</p>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading ingredients...</p>
          ) : ingredients.length === 0 ? (
            <p className="text-gray-500">No ingredients added yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-white shadow">
              <table className="w-full text-sm">
                <thead className="bg-[#FFD23F] text-[#333333]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Ingredient</th>
                    <th className="px-4 py-3 text-left font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient, idx) => (
                    <tr key={ingredient.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 font-medium">{ingredient.name}</td>
                      <td className="px-4 py-3">{ingredient.quantity}</td>
                      <td className="px-4 py-3 text-gray-500">{ingredient.unit}</td>
                      <td className="px-4 py-3">{stockBadge(ingredient.quantity, ingredient.lowStockThreshold)}</td>
                      <td className="px-4 py-3 flex gap-2 flex-wrap">
                        <button
                          onClick={() => { setEditingIngredient(ingredient); setForm({ name: ingredient.name, quantity: String(ingredient.quantity), unit: ingredient.unit, lowStockThreshold: String(ingredient.lowStockThreshold) }); setShowModal(true); }}
                          className="rounded-lg bg-[#FFD23F] px-3 py-1 text-xs font-semibold text-[#333333] hover:bg-[#f0c930]"
                        >Edit</button>
                        <button
                          onClick={() => { setRestockTarget(ingredient); setRestockAmount(""); }}
                          className="rounded-lg bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-200"
                        >Restock</button>
                        <button
                          onClick={() => handleDelete(ingredient)}
                          className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold">Product–Ingredient Linking</h2>
            <p className="mb-4 text-sm text-gray-600">Assign required ingredients to each menu product so the kiosk can check availability automatically.</p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const links = productIngredientsMap[product.id] ?? [];
                return (
                  <div key={product.id} className="rounded-xl bg-white p-4 shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category}</p>
                      </div>
                      <button
                        onClick={() => openLinkModal(product)}
                        className="shrink-0 rounded-lg bg-[#FFD23F] px-3 py-1 text-xs font-semibold text-[#333333] hover:bg-[#f0c930]"
                      >
                        {links.length > 0 ? "Edit Links" : "Link Ingredients"}
                      </button>
                    </div>
                    {links.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {links.map((link, i) => {
                          const ing = ingredients.find((x) => x.id === link.ingredientId);
                          return (
                            <li key={i} className="text-xs text-gray-600">
                              • {ing?.name ?? link.ingredientId} — {link.requiredQuantity} {ing?.unit ?? ""}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400 italic">No ingredients linked</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold">{editingIngredient ? "Edit Ingredient" : "Add Ingredient"}</h2>
            <form onSubmit={handleSubmit} className="grid gap-3">
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Ingredient name" className="rounded-lg border border-gray-300 px-3 py-2" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" value={form.quantity} onChange={(e) => setForm((c) => ({ ...c, quantity: e.target.value }))} placeholder="Quantity" className="rounded-lg border border-gray-300 px-3 py-2" required />
                <select value={form.unit} onChange={(e) => setForm((c) => ({ ...c, unit: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2">
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm((c) => ({ ...c, lowStockThreshold: e.target.value }))} placeholder="Low stock warning at" className="rounded-lg border border-gray-300 px-3 py-2" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-[#FFD23F] px-4 py-2 font-semibold text-[#333333] disabled:opacity-60">
                  {saving ? "Saving..." : editingIngredient ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold">Restock: {restockTarget.name}</h2>
            <input type="number" min="1" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} placeholder={`Amount to add (${restockTarget.unit})`} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setRestockTarget(null)} className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700">Cancel</button>
              <button onClick={handleRestock} className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-600">Restock</button>
            </div>
          </div>
        </div>
      )}

      {linkingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold">Link Ingredients: {linkingProduct.name}</h2>
            <p className="mb-4 text-sm text-gray-500">Set which ingredients are consumed when this product is ordered.</p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {linkedIngredients.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={row.ingredientId}
                    onChange={(e) => updateIngredientRow(i, "ingredientId", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  >
                    <option value="">Select ingredient</option>
                    {ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                  </select>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={row.requiredQuantity}
                    onChange={(e) => updateIngredientRow(i, "requiredQuantity", Number(e.target.value))}
                    className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  />
                  <button onClick={() => removeIngredientRow(i)} className="text-red-500 hover:text-red-700 font-bold px-1">✕</button>
                </div>
              ))}
            </div>
            <button onClick={addIngredientRow} className="mt-3 text-sm text-blue-600 hover:underline">+ Add ingredient</button>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setLinkingProduct(null)} className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700">Cancel</button>
              <button onClick={handleSaveLink} disabled={savingLink} className="rounded-xl bg-[#FFD23F] px-4 py-2 font-semibold text-[#333333] disabled:opacity-60">
                {savingLink ? "Saving..." : "Save Links"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
