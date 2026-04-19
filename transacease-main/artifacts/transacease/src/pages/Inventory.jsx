import React, { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import { addProduct, deleteProduct, restockProduct, subscribeToProducts, updateProduct } from "../services/productService";

const PRESETS = [
  { name: "Classic Burger", category: "Burgers", price: 89, stock: 50, reorderLevel: 10, sku: "BRG-001" },
  { name: "Cheese Burger", category: "Burgers", price: 99, stock: 50, reorderLevel: 10, sku: "BRG-002" },
  { name: "Double Burger", category: "Burgers", price: 129, stock: 30, reorderLevel: 5, sku: "BRG-003" },
  { name: "Fried Chicken", category: "Chicken", price: 109, stock: 50, reorderLevel: 10, sku: "CHK-001" },
  { name: "Chicken Sandwich", category: "Chicken", price: 99, stock: 40, reorderLevel: 8, sku: "CHK-002" },
  { name: "Chicken Rice Meal", category: "Chicken", price: 119, stock: 40, reorderLevel: 8, sku: "CHK-003" },
  { name: "Pork Sisig Rice", category: "Rice Meals", price: 129, stock: 30, reorderLevel: 5, sku: "RM-001" },
  { name: "Chicken Adobo Rice", category: "Rice Meals", price: 119, stock: 30, reorderLevel: 5, sku: "RM-002" },
  { name: "Tapsilog", category: "Rice Meals", price: 139, stock: 25, reorderLevel: 5, sku: "RM-003" },
  { name: "Bangsilog", category: "Rice Meals", price: 129, stock: 25, reorderLevel: 5, sku: "RM-004" },
  { name: "French Fries", category: "Sides", price: 59, stock: 60, reorderLevel: 10, sku: "SID-001" },
  { name: "Onion Rings", category: "Sides", price: 69, stock: 40, reorderLevel: 8, sku: "SID-002" },
  { name: "Coleslaw", category: "Sides", price: 45, stock: 40, reorderLevel: 8, sku: "SID-003" },
  { name: "Coca-Cola", category: "Drinks", price: 45, stock: 100, reorderLevel: 20, sku: "DRK-001" },
  { name: "Sprite", category: "Drinks", price: 45, stock: 100, reorderLevel: 20, sku: "DRK-002" },
  { name: "Iced Tea", category: "Drinks", price: 55, stock: 80, reorderLevel: 15, sku: "DRK-003" },
  { name: "Bottled Water", category: "Drinks", price: 30, stock: 100, reorderLevel: 20, sku: "DRK-004" },
  { name: "Orange Juice", category: "Drinks", price: 65, stock: 60, reorderLevel: 15, sku: "DRK-005" },
  { name: "Halo-Halo", category: "Desserts", price: 89, stock: 30, reorderLevel: 5, sku: "DST-001" },
  { name: "Leche Flan", category: "Desserts", price: 79, stock: 20, reorderLevel: 5, sku: "DST-002" },
  { name: "Ice Cream", category: "Desserts", price: 49, stock: 40, reorderLevel: 8, sku: "DST-003" },
  { name: "Nachos", category: "Snacks", price: 75, stock: 40, reorderLevel: 8, sku: "SNK-001" },
  { name: "Hotdog", category: "Snacks", price: 55, stock: 50, reorderLevel: 10, sku: "SNK-002" },
  { name: "Spaghetti", category: "Pasta", price: 99, stock: 30, reorderLevel: 5, sku: "PST-001" },
];

const PRESET_CATEGORIES = [...new Set(PRESETS.map((p) => p.category))];

const emptyForm = { name: "", category: "", price: "", stock: "", reorderLevel: "", sku: "", image: "" };

const currencyFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

const statusBadge = (stock, reorderLevel) => {
  if (stock <= reorderLevel) return <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Low Stock</span>;
  if (stock <= reorderLevel + 5) return <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700">Watch</span>;
  return <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">In Stock</span>;
};

const Inventory = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
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
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || product.category === filter;
    return matchesSearch && matchesFilter;
  }), [products, search, filter]);

  const resetForm = () => { setForm(emptyForm); setEditingProduct(null); setShowModal(false); };

  const openAddModal = () => { setEditingProduct(null); setForm(emptyForm); setShowModal(true); };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name ?? "", category: product.category ?? "", price: String(product.price ?? ""),
      stock: String(product.stock ?? ""), reorderLevel: String(product.reorderLevel ?? ""),
      sku: product.sku ?? "", image: product.image ?? "",
    });
    setShowModal(true);
  };

  const applyPreset = (preset) => {
    setForm({ name: preset.name, category: preset.category, price: String(preset.price), stock: String(preset.stock), reorderLevel: String(preset.reorderLevel), sku: preset.sku, image: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), category: form.category.trim() || "Uncategorized",
        price: Number(form.price), stock: Number(form.stock),
        reorderLevel: Number(form.reorderLevel || 0), sku: form.sku.trim(), image: form.image.trim(),
      };
      if (!payload.name) throw new Error("Product name is required.");
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        enqueueSnackbar("Product updated.", { variant: "success" });
      } else {
        await addProduct(payload);
        enqueueSnackbar("Product added.", { variant: "success" });
      }
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

  const columns = [
    { key: "name", header: "Product" },
    { key: "category", header: "Category" },
    { key: "sku", header: "SKU" },
    { key: "price", header: "Price", render: (val) => currencyFormatter.format(val) },
    { key: "stock", header: "Stock" },
    { key: "status", header: "Status", render: (_, row) => statusBadge(row.stock, row.reorderLevel) },
    {
      key: "actions", header: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="rounded-lg bg-[#FFD23F] px-3 py-1 text-xs font-semibold text-[#333]">Edit</button>
          <button onClick={() => handleRestock(row)} className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Restock</button>
          <button onClick={() => handleDelete(row)} className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#333333]">Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">{products.length} products total</p>
          </div>
          <button onClick={openAddModal} className="rounded-xl bg-[#FFD23F] px-5 py-2.5 font-semibold text-[#333333] shadow-sm hover:bg-[#f4c72f]">
            + Add Product
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU…"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFD23F] w-64" />
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${filter === cat ? "bg-[#333333] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-gray-400 text-center mt-20">Loading inventory…</p> : (
          <Table columns={columns} data={filtered} emptyMessage="No products found." />
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#333]">{editingProduct ? "Edit Product" : "Add Product"}</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>

              {!editingProduct && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Quick Presets — click to fill the form instantly</p>
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
                      <button key={preset.sku} onClick={() => applyPreset(preset)}
                        className="rounded-xl border border-[#FFD23F] bg-[#FFFBEA] px-3 py-1.5 text-xs font-semibold text-[#333] hover:bg-[#FFD23F] transition">
                        {preset.name} <span className="text-gray-400 ml-1">₱{preset.price}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 mt-4 mb-1" />
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Product name *" required className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2" />
                <input value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} placeholder="Category" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input value={form.sku} onChange={(e) => setForm((c) => ({ ...c, sku: e.target.value }))} placeholder="SKU" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input type="number" min="0" value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))} placeholder="Price" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm((c) => ({ ...c, stock: e.target.value }))} placeholder="Stock" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm((c) => ({ ...c, reorderLevel: e.target.value }))} placeholder="Reorder level" className="rounded-lg border border-gray-300 px-3 py-2" />
                <input value={form.image} onChange={(e) => setForm((c) => ({ ...c, image: e.target.value }))} placeholder="Image URL (optional)" className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2" />
                <div className="flex justify-end gap-3 md:col-span-2">
                  <button type="button" onClick={resetForm} className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-xl bg-[#FFD23F] px-4 py-2 font-semibold text-[#333333] disabled:opacity-60">
                    {saving ? "Saving…" : editingProduct ? "Update Product" : "Add Product"}
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
