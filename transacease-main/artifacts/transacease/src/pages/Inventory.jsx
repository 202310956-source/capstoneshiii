import React, { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import Sidebar from "../components/Sidebar";
import { addProduct, deleteProduct, restockProduct, subscribeToProducts } from "../services/productService";

const PRESETS = [
  { name: "Classic Burger", category: "Burgers", price: 89, stock: 50 },
  { name: "Cheese Burger", category: "Burgers", price: 99, stock: 50 },
  { name: "Double Burger", category: "Burgers", price: 129, stock: 30 },
  { name: "Fried Chicken", category: "Chicken", price: 109, stock: 50 },
  { name: "Chicken Sandwich", category: "Chicken", price: 99, stock: 40 },
  { name: "Chicken Rice Meal", category: "Chicken", price: 119, stock: 40 },
  { name: "Pork Sisig Rice", category: "Rice Meals", price: 129, stock: 30 },
  { name: "Chicken Adobo Rice", category: "Rice Meals", price: 119, stock: 30 },
  { name: "Tapsilog", category: "Rice Meals", price: 139, stock: 25 },
  { name: "Bangsilog", category: "Rice Meals", price: 129, stock: 25 },
  { name: "French Fries", category: "Sides", price: 59, stock: 60 },
  { name: "Onion Rings", category: "Sides", price: 69, stock: 40 },
  { name: "Coleslaw", category: "Sides", price: 45, stock: 40 },
  { name: "Coca-Cola", category: "Drinks", price: 45, stock: 100 },
  { name: "Sprite", category: "Drinks", price: 45, stock: 100 },
  { name: "Iced Tea", category: "Drinks", price: 55, stock: 80 },
  { name: "Bottled Water", category: "Drinks", price: 30, stock: 100 },
  { name: "Orange Juice", category: "Drinks", price: 65, stock: 60 },
  { name: "Halo-Halo", category: "Desserts", price: 89, stock: 30 },
  { name: "Leche Flan", category: "Desserts", price: 79, stock: 20 },
  { name: "Ice Cream", category: "Desserts", price: 49, stock: 40 },
  { name: "Nachos", category: "Snacks", price: 75, stock: 40 },
  { name: "Hotdog", category: "Snacks", price: 55, stock: 50 },
  { name: "Spaghetti", category: "Pasta", price: 99, stock: 30 },
];

const PRESET_CATEGORIES = [...new Set(PRESETS.map((p) => p.category))];
const emptyForm = { name: "", category: "", price: "", stock: "" };
const currencyFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

const Inventory = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingPreset, setAddingPreset] = useState(null);
  const [presetCategory, setPresetCategory] = useState(PRESET_CATEGORIES[0]);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (nextProducts) => { setProducts(nextProducts); setLoading(false); },
      (error) => { setLoading(false); enqueueSnackbar(error.message || "Unable to load inventory.", { variant: "error" }); },
    );
    return unsubscribe;
  }, []);

  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);

  const filtered = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || product.category === filter;
    return matchesSearch && matchesFilter;
  }), [products, search, filter]);

  const resetForm = () => { setForm(emptyForm); setShowModal(false); };

  const handleQuickAdd = async (preset) => {
    setAddingPreset(preset.name);
    try {
      await addProduct({ name: preset.name, category: preset.category, price: preset.price, stock: preset.stock, reorderLevel: 5, sku: "", image: "" });
      enqueueSnackbar(`"${preset.name}" added to inventory!`, { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error.message || "Unable to add product.", { variant: "error" });
    } finally {
      setAddingPreset(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), category: form.category.trim() || "Uncategorized", price: Number(form.price), stock: Number(form.stock), reorderLevel: 5, sku: "", image: "" };
      if (!payload.name) throw new Error("Product name is required.");
      await addProduct(payload);
      enqueueSnackbar("Product added.", { variant: "success" });
      resetForm();
    } catch (error) {
      enqueueSnackbar(error.message || "Unable to save product.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await deleteProduct(product.id);
      enqueueSnackbar("Product deleted.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error.message || "Unable to delete product.", { variant: "error" });
    }
  };

  const handleRestock = async (product) => {
    const input = window.prompt(`Restock "${product.name}"\nCurrent stock: ${product.stock}\n\nEnter quantity to add:`);
    if (!input) return;
    const qty = Number(input);
    if (!Number.isFinite(qty) || qty <= 0) { enqueueSnackbar("Enter a valid positive number.", { variant: "warning" }); return; }
    try {
      await restockProduct(product.id, qty);
      enqueueSnackbar(`Restocked ${product.name} by ${qty}.`, { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error.message || "Unable to restock.", { variant: "error" });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#333333]">Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">{products.length} products total</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
            className="rounded-xl bg-[#FFD23F] px-5 py-2.5 font-semibold text-[#333333] shadow-sm hover:bg-[#f4c72f]">
            + Add Custom Product
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <p className="text-sm font-bold text-gray-700 mb-3">Quick Add — click any item to instantly add it</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {PRESET_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setPresetCategory(cat)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${presetCategory === cat ? "bg-[#333] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => p.category === presetCategory).map((preset) => (
              <button key={preset.name} onClick={() => handleQuickAdd(preset)} disabled={addingPreset === preset.name}
                className="rounded-xl border border-[#FFD23F] bg-[#FFFBEA] px-4 py-2 text-sm font-semibold text-[#333] hover:bg-[#FFD23F] transition disabled:opacity-50">
                {addingPreset === preset.name ? "Adding…" : preset.name}
                <span className="ml-1.5 text-gray-400 text-xs">₱{preset.price}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFD23F] w-56" />
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${filter === cat ? "bg-[#333333] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center mt-20">Loading inventory…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-center mt-20">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[#333] text-base">{product.name}</p>
                    <span className="text-xs text-gray-400">{product.category}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${product.stock === 0 ? "bg-red-100 text-red-600" : product.stock <= 10 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"}`}>
                    {product.stock === 0 ? "Out of Stock" : `${product.stock} in stock`}
                  </span>
                </div>
                <p className="text-[#FFD23F] font-bold text-lg">{currencyFormatter.format(product.price)}</p>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => handleRestock(product)} className="flex-1 rounded-xl bg-blue-50 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100">Restock</button>
                  <button onClick={() => handleDelete(product)} className="flex-1 rounded-xl bg-red-50 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-100">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#333]">Add Custom Product</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Product name *" required className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD23F]" />
                <input value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} placeholder="Category (e.g. Drinks)" className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD23F]" />
                <input type="number" min="0" value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))} placeholder="Price (₱)" className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD23F]" />
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm((c) => ({ ...c, stock: e.target.value }))} placeholder="Starting stock" className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD23F]" />
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-600">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#FFD23F] py-2.5 font-semibold text-[#333] disabled:opacity-60">
                    {saving ? "Saving…" : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Inventory;
