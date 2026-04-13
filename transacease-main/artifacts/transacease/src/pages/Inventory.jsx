import React, { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import { addProduct, deleteProduct, restockProduct, subscribeToProducts, updateProduct } from "../services/productService";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  reorderLevel: "",
  sku: "",
  image: "",
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

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

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (nextProducts) => {
        setProducts(nextProducts);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        enqueueSnackbar(error.message || "Unable to load inventory.", { variant: "error" });
      },
    );

    return unsubscribe;
  }, []);

  const categories = useMemo(() => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))], [products]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "All" || product.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProduct(null);
    setShowModal(false);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name ?? "",
      category: product.category ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      reorderLevel: String(product.reorderLevel ?? ""),
      sku: product.sku ?? "",
      image: product.image ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || "Uncategorized",
        price: Number(form.price),
        stock: Number(form.stock),
        reorderLevel: Number(form.reorderLevel || 0),
        sku: form.sku.trim(),
        image: form.image.trim(),
      };

      if (!payload.name) {
        throw new Error("Product name is required.");
      }

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
    if (!window.confirm(`Delete ${product.name}?`)) return;

    try {
      await deleteProduct(product.id);
      enqueueSnackbar("Product deleted.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error.message || "Unable to delete product.", { variant: "error" });
    }
  };

  const handleRestock = async (product) => {
    const response = window.prompt(`Restock quantity for ${product.name}`, "1");

    if (!response) return;

    try {
      await restockProduct(product.id, Number(response));
      enqueueSnackbar("Stock updated.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error.message || "Unable to restock product.", { variant: "error" });
    }
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Category", accessor: "category" },
    { header: "Price", accessor: "price", cell: (row) => currencyFormatter.format(row.price) },
    { header: "Stock", accessor: "stock" },
    { header: "Status", accessor: "status", cell: (row) => statusBadge(row.stock, row.reorderLevel) },
    { header: "SKU", accessor: "sku" },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openEditModal(row)} className="rounded bg-blue-100 px-2 py-1 text-blue-700">
            Edit
          </button>
          <button onClick={() => handleRestock(row)} className="rounded bg-amber-100 px-2 py-1 text-amber-700">
            Restock
          </button>
          <button onClick={() => handleDelete(row)} className="rounded bg-red-100 px-2 py-1 text-red-700">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#333333]">
      <div className="flex">
        <Sidebar active="Inventory" />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold font-poppins">Inventory Management</h1>
              <p className="text-gray-600">Track stock and manage inventory items easily.</p>
            </div>
            <button onClick={openAddModal} className="rounded-xl bg-[#FFD23F] px-4 py-2 font-semibold text-[#333333] hover:bg-[#ffcf3f]">
              + Add Product
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 md:w-1/2"
            />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 md:w-1/4">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                No products yet. Add your first inventory item to begin syncing stock with POS and dashboard.
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                No products matched your current search.
              </div>
            ) : (
              <Table columns={columns} data={filtered} />
            )}
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#333333]">{editingProduct ? "Edit Product" : "Add Product"}</h2>
                    <p className="text-sm text-gray-500">Changes save directly to Firestore.</p>
                  </div>
                  <button onClick={resetForm} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
                    Close
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Product name"
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <input
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Category"
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    placeholder="Price"
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                    placeholder="Stock"
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <input
                    type="number"
                    min="0"
                    value={form.reorderLevel}
                    onChange={(event) => setForm((current) => ({ ...current, reorderLevel: event.target.value }))}
                    placeholder="Reorder level"
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <input
                    value={form.sku}
                    onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                    placeholder="SKU"
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <input
                    value={form.image}
                    onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                    placeholder="Image URL (optional)"
                    className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
                  />
                  <div className="flex justify-end gap-3 md:col-span-2">
                    <button type="button" onClick={resetForm} className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="rounded-xl bg-[#FFD23F] px-4 py-2 font-semibold text-[#333333] disabled:opacity-60">
                      {saving ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Inventory;
