import React, { useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { FaTag } from "react-icons/fa";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { subscribeToDiscounts, addDiscount, updateDiscount, deleteDiscount } from "../../services/discountService";

const emptyForm = { code: "", type: "percentage", value: "", minOrderAmount: "", maxUsage: "", expiresAt: "", isActive: true };

const isExpired = (expiresAt) => expiresAt && new Date() > new Date(expiresAt);

const formatDate = (val) => {
  if (!val) return "No expiry";
  const date = val.toDate ? val.toDate() : new Date(val);
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
};

const DiscountManager = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToDiscounts(
      (data) => { setDiscounts(data); setLoading(false); },
      (err) => { setLoading(false); enqueueSnackbar(err.message || "Failed to load discounts.", { variant: "error" }); },
    );
    return unsubscribe;
  }, []);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      code: item.code,
      type: item.type,
      value: String(item.value),
      minOrderAmount: String(item.minOrderAmount),
      maxUsage: String(item.maxUsage),
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split("T")[0] : "",
      isActive: item.isActive,
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxUsage: Number(form.maxUsage || 0),
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      };
      if (!payload.code) throw new Error("Discount code is required.");
      if (editItem) {
        await updateDiscount(editItem.id, payload);
        enqueueSnackbar("Discount updated!", { variant: "success" });
      } else {
        await addDiscount(payload);
        enqueueSnackbar("Discount created!", { variant: "success" });
      }
      closeModal();
    } catch (err) {
      enqueueSnackbar(err.message || "Failed to save discount.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this discount code?")) return;
    try {
      await deleteDiscount(id);
      enqueueSnackbar("Discount deleted.", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message || "Failed to delete.", { variant: "error" });
    }
  };

  const handleToggle = async (item) => {
    try {
      await updateDiscount(item.id, { isActive: !item.isActive });
      enqueueSnackbar(`Discount ${item.isActive ? "deactivated" : "activated"}.`, { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message || "Failed to update.", { variant: "error" });
    }
  };

  const active = discounts.filter((d) => d.isActive && !isExpired(d.expiresAt)).length;
  const expired = discounts.filter((d) => isExpired(d.expiresAt)).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[#f5f5f5] text-2xl font-bold">Discount Management</h1>
          <p className="text-[#ababab] text-sm mt-1">{discounts.length} discount codes total</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold">
          <MdAdd size={20} /> Add Discount
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Codes", value: discounts.length, color: "#5b45b0" },
          { label: "Active Codes", value: active, color: "#02ca3a" },
          { label: "Expired", value: expired, color: "#e53935" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: color + "22", border: `1px solid ${color}44` }}>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <p className="text-[#ababab] text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-[#ababab] text-center mt-10">Loading discounts…</p>
      ) : discounts.length === 0 ? (
        <div className="text-center mt-10">
          <FaTag size={40} className="mx-auto text-[#383838] mb-3" />
          <p className="text-[#ababab]">No discount codes yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {discounts.map((d) => {
            const expired = isExpired(d.expiresAt);
            return (
              <div key={d.id} className={`rounded-xl bg-[#2a2a2a] border p-5 flex flex-col gap-3 ${expired ? "border-red-800/40 opacity-70" : d.isActive ? "border-[#383838]" : "border-[#383838] opacity-60"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaTag className="text-[#f6b100]" />
                    <span className="font-bold text-white text-lg tracking-widest">{d.code}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${expired ? "bg-red-900/50 text-red-400" : d.isActive ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                    {expired ? "Expired" : d.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-sm text-[#ababab] flex flex-col gap-1">
                  <span>Type: <span className="text-white capitalize">{d.type}</span></span>
                  <span>Value: <span className="text-white">{d.type === "percentage" ? `${d.value}%` : `₱${d.value}`}</span></span>
                  {d.minOrderAmount > 0 && <span>Min order: <span className="text-white">₱{d.minOrderAmount}</span></span>}
                  {d.maxUsage > 0 && <span>Max uses: <span className="text-white">{d.usageCount}/{d.maxUsage}</span></span>}
                  <span>Expires: <span className="text-white">{formatDate(d.expiresAt)}</span></span>
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-[#383838]">
                  <button onClick={() => handleToggle(d)} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${d.isActive ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-green-800/50 text-green-400 hover:bg-green-700/50"}`}>
                    {d.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => openEdit(d)} className="rounded-lg bg-[#383838] p-1.5 text-[#ababab] hover:text-white">
                    <MdEdit size={16} />
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="rounded-lg bg-red-900/30 p-1.5 text-red-400 hover:bg-red-900/60">
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl bg-[#2a2a2a] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{editItem ? "Edit Discount" : "New Discount Code"}</h2>
              <button onClick={closeModal} className="text-[#ababab] hover:text-white"><IoMdClose size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-1">Code *</label>
                <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                  placeholder="e.g. SAVE20" />
              </div>
              <div>
                <label className="block text-[#ababab] text-sm mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#f6b100]">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₱)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#ababab] text-sm mb-1">Value * {form.type === "percentage" ? "(%)" : "(₱)"}</label>
                <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} required min="0"
                  max={form.type === "percentage" ? 100 : undefined}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                  placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 100"} />
              </div>
              {[{ label: "Min Order Amount (₱)", key: "minOrderAmount", placeholder: "0 = no minimum" },
                { label: "Max Usage (0 = unlimited)", key: "maxUsage", placeholder: "0" }].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-[#ababab] text-sm mb-1">{label}</label>
                  <input type="number" min="0" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                    placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-[#ababab] text-sm mb-1">Expiry Date (optional)</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#f6b100]" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
                <label htmlFor="isActive" className="text-[#ababab] text-sm">Active immediately</label>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#f6b100] text-[#1f1f1f] py-3 rounded-lg font-bold disabled:opacity-60 mt-2">
                {saving ? "Saving…" : editItem ? "Update Discount" : "Create Discount"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DiscountManager;
