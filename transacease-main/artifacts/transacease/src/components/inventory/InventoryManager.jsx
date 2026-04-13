import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, addProduct, updateProduct, deleteProduct, adjustStock } from "../../https";
import { enqueueSnackbar } from "notistack";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";

const emptyForm = { name: "", sku: "", category: "", price: "", stock: "", unit: "pcs", lowStockThreshold: 10 };

const InventoryManager = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [stockModal, setStockModal] = useState(null);
  const [adjustment, setAdjustment] = useState("");
  const [filterLow, setFilterLow] = useState(false);

  const { data: resData, isLoading } = useQuery({
    queryKey: ["products", filterLow],
    queryFn: () => getProducts(filterLow ? { lowStock: true } : {}),
  });

  const products = resData?.data.data || [];

  const addMutation = useMutation({
    mutationFn: (data) => addProduct(data),
    onSuccess: () => {
      enqueueSnackbar("Product added!", { variant: "success" });
      queryClient.invalidateQueries(["products"]);
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || "Error", { variant: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      enqueueSnackbar("Product updated!", { variant: "success" });
      queryClient.invalidateQueries(["products"]);
      setShowModal(false);
      setEditItem(null);
      setForm(emptyForm);
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || "Error", { variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      enqueueSnackbar("Product deleted!", { variant: "success" });
      queryClient.invalidateQueries(["products"]);
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || "Error", { variant: "error" }),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, adjustment }) => adjustStock(id, adjustment),
    onSuccess: () => {
      enqueueSnackbar("Stock adjusted!", { variant: "success" });
      queryClient.invalidateQueries(["products"]);
      setStockModal(null);
      setAdjustment("");
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || "Error", { variant: "error" }),
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, sku: item.sku || "", category: item.category, price: item.price, stock: item.stock, unit: item.unit, lowStockThreshold: item.lowStockThreshold });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) updateMutation.mutate({ id: editItem.id, data: form });
    else addMutation.mutate(form);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[#f5f5f5] text-2xl font-bold">Inventory Management</h1>
          <p className="text-[#ababab] text-sm mt-1">{products.length} products total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterLow((p) => !p)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filterLow ? "bg-red-600 text-white" : "bg-[#1a1a1a] text-[#ababab]"
            }`}
          >
            {filterLow ? "⚠ Low Stock Only" : "All Products"}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold"
          >
            <MdAdd size={20} /> Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-[#ababab]">Loading...</p>
      ) : (
        <div className="bg-[#262626] rounded-lg overflow-hidden">
          <table className="w-full text-left text-[#f5f5f5]">
            <thead className="bg-[#333] text-[#ababab] text-sm">
              <tr>
                {["Product", "SKU", "Category", "Price", "Stock", "Unit", "Status", "Actions"].map((h) => (
                  <th key={h} className="p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#ababab]">
                    <FaBoxOpen size={40} className="mx-auto mb-2 opacity-40" />
                    No products found
                  </td>
                </tr>
              ) : products.map((item) => (
                <tr key={item.id} className="border-b border-[#333] hover:bg-[#2a2a2a]">
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3 text-[#ababab] text-sm">{item.sku || "—"}</td>
                  <td className="p-3 text-[#ababab] text-sm">{item.category}</td>
                  <td className="p-3 text-[#f6b100] font-semibold">₹{item.price}</td>
                  <td className="p-3">
                    <button
                      onClick={() => { setStockModal(item); setAdjustment(""); }}
                      className="font-semibold hover:underline"
                      style={{ color: item.stock <= item.lowStockThreshold ? "#ef4444" : "#02ca3a" }}
                    >
                      {item.stock} {item.unit}
                    </button>
                  </td>
                  <td className="p-3 text-[#ababab] text-sm">{item.unit}</td>
                  <td className="p-3">
                    {item.stock <= item.lowStockThreshold ? (
                      <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">Low Stock</span>
                    ) : (
                      <span className="text-xs bg-[#2e4a40] text-green-400 px-2 py-1 rounded-full">In Stock</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="bg-[#025cca] p-2 rounded-lg hover:opacity-80">
                        <MdEdit size={16} className="text-white" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm("Delete this product?")) deleteMutation.mutate(item.id); }}
                        className="bg-red-700 p-2 rounded-lg hover:opacity-80"
                      >
                        <MdDelete size={16} className="text-white" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#262626] p-6 rounded-lg shadow-lg w-[500px] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#f5f5f5] text-xl font-semibold">{editItem ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#ababab] hover:text-red-400">
                <IoMdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Product Name *", key: "name", type: "text", required: true },
                { label: "SKU", key: "sku", type: "text" },
                { label: "Category", key: "category", type: "text" },
                { label: "Price (₹) *", key: "price", type: "number", required: true },
                { label: "Stock Quantity *", key: "stock", type: "number", required: true },
                { label: "Low Stock Threshold", key: "lowStockThreshold", type: "number" },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-[#ababab] text-sm mb-1">{label}</label>
                  <input
                    type={type} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    required={required}
                    className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[#ababab] text-sm mb-1">Unit</label>
                <select value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none">
                  {["pcs", "kg", "litre", "box", "pack", "dozen"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={addMutation.isPending || updateMutation.isPending}
                className="w-full bg-[#f6b100] text-[#1f1f1f] py-3 rounded-lg font-bold disabled:opacity-60 mt-2">
                {editItem ? "Update Product" : "Add Product"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#262626] p-6 rounded-lg shadow-lg w-[380px]"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#f5f5f5] text-xl font-semibold">Adjust Stock</h2>
              <button onClick={() => setStockModal(null)} className="text-[#ababab] hover:text-red-400"><IoMdClose size={24} /></button>
            </div>
            <p className="text-[#ababab] text-sm mb-1">{stockModal.name}</p>
            <p className="text-[#f5f5f5] text-lg font-bold mb-4">
              Current Stock: <span className="text-[#f6b100]">{stockModal.stock} {stockModal.unit}</span>
            </p>
            <label className="block text-[#ababab] text-sm mb-2">
              Adjustment (positive = restock, negative = deduct)
            </label>
            <input type="number" value={adjustment} onChange={(e) => setAdjustment(e.target.value)}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#f6b100] mb-4"
              placeholder="e.g. 50 or -10" />
            <button
              onClick={() => stockMutation.mutate({ id: stockModal.id, adjustment: Number(adjustment) })}
              disabled={!adjustment || stockMutation.isPending}
              className="w-full bg-[#f6b100] text-[#1f1f1f] py-3 rounded-lg font-bold disabled:opacity-60"
            >
              {stockMutation.isPending ? "Adjusting..." : "Confirm Adjustment"}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
