import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDiscounts, addDiscount, updateDiscount, deleteDiscount } from "../../https";
import { enqueueSnackbar } from "notistack";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { FaTag } from "react-icons/fa";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { formatDateAndTime } from "../../utils";

const emptyForm = { code: "", type: "percentage", value: "", minOrderAmount: "", maxUsage: "", expiresAt: "", isActive: true };

const DiscountManager = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: resData, isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: () => getDiscounts(),
  });

  const discounts = resData?.data.data || [];

  const addMutation = useMutation({
    mutationFn: (data) => addDiscount(data),
    onSuccess: () => {
      enqueueSnackbar("Discount created!", { variant: "success" });
      queryClient.invalidateQueries(["discounts"]);
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || "Error", { variant: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDiscount(id, data),
    onSuccess: () => {
      enqueueSnackbar("Discount updated!", { variant: "success" });
      queryClient.invalidateQueries(["discounts"]);
      setShowModal(false);
      setEditItem(null);
      setForm(emptyForm);
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || "Error", { variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDiscount(id),
    onSuccess: () => {
      enqueueSnackbar("Discount deleted!", { variant: "success" });
      queryClient.invalidateQueries(["discounts"]);
    },
    onError: (e) => enqueueSnackbar(e.response?.data?.message || "Error", { variant: "error" }),
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      code: item.code, type: item.type, value: item.value,
      minOrderAmount: item.minOrderAmount, maxUsage: item.maxUsage,
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split("T")[0] : "",
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, code: form.code.toUpperCase() };
    if (editItem) updateMutation.mutate({ id: editItem.id, data: payload });
    else addMutation.mutate(payload);
  };

  const toggleActive = (item) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  const isExpired = (expiresAt) => expiresAt && new Date() > new Date(expiresAt);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[#f5f5f5] text-2xl font-bold">Discount Management</h1>
          <p className="text-[#ababab] text-sm mt-1">{discounts.length} discount codes total</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#f6b100] text-[#1f1f1f] px-4 py-2 rounded-lg font-semibold"
        >
          <MdAdd size={20} /> Add Discount
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Codes", value: discounts.length, color: "#5b45b0" },
          { label: "Active Codes", value: discounts.filter((d) => d.isActive && !isExpired(d.expiresAt)).length, color: "#02ca3a" },
          { label: "Expired / Inactive", value: discounts.filter((d) => !d.isActive || isExpired(d.expiresAt)).length, color: "#be3e3f" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-4 text-[#f5f5f5]" style={{ backgroundColor: color }}>
            <p className="text-sm opacity-80">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-[#ababab]">Loading...</p>
      ) : (
        <div className="bg-[#262626] rounded-lg overflow-hidden">
          <table className="w-full text-left text-[#f5f5f5]">
            <thead className="bg-[#333] text-[#ababab] text-sm">
              <tr>
                {["Code", "Type", "Value", "Min Order", "Usage", "Expires", "Status", "Actions"].map((h) => (
                  <th key={h} className="p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#ababab]">
                    <FaTag size={40} className="mx-auto mb-2 opacity-40" />
                    No discount codes yet
                  </td>
                </tr>
              ) : discounts.map((discount) => {
                const expired = isExpired(discount.expiresAt);
                return (
                  <tr key={discount.id} className="border-b border-[#333] hover:bg-[#2a2a2a]">
                    <td className="p-3">
                      <span className="font-mono font-bold text-[#f6b100] bg-[#1f1f1f] px-2 py-1 rounded">
                        {discount.code}
                      </span>
                    </td>
                    <td className="p-3 capitalize text-[#ababab] text-sm">{discount.type}</td>
                    <td className="p-3 font-semibold">
                      {discount.type === "percentage" ? `${discount.value}%` : `₹${discount.value}`}
                    </td>
                    <td className="p-3 text-[#ababab] text-sm">
                      {discount.minOrderAmount > 0 ? `₹${discount.minOrderAmount}` : "None"}
                    </td>
                    <td className="p-3 text-sm">
                      <span className="text-[#ababab]">{discount.usageCount}</span>
                      {discount.maxUsage > 0 && <span className="text-[#ababab]"> / {discount.maxUsage}</span>}
                    </td>
                    <td className="p-3 text-sm text-[#ababab]">
                      {discount.expiresAt
                        ? <span className={expired ? "text-red-400" : "text-green-400"}>
                            {new Date(discount.expiresAt).toLocaleDateString()}
                          </span>
                        : "Never"}
                    </td>
                    <td className="p-3">
                      {expired ? (
                        <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">Expired</span>
                      ) : discount.isActive ? (
                        <span className="text-xs bg-[#2e4a40] text-green-400 px-2 py-1 rounded-full">Active</span>
                      ) : (
                        <span className="text-xs bg-[#333] text-[#ababab] px-2 py-1 rounded-full">Inactive</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(discount)}
                          className={`px-2 py-1 rounded text-xs font-semibold ${discount.isActive ? "bg-[#4a452e] text-yellow-400" : "bg-[#2e4a40] text-green-400"}`}>
                          {discount.isActive ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => openEdit(discount)} className="bg-[#025cca] p-2 rounded-lg hover:opacity-80">
                          <MdEdit size={14} className="text-white" />
                        </button>
                        <button
                          onClick={() => { if (window.confirm("Delete this discount?")) deleteMutation.mutate(discount.id); }}
                          className="bg-red-700 p-2 rounded-lg hover:opacity-80"
                        >
                          <MdDelete size={14} className="text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#262626] p-6 rounded-lg shadow-lg w-[480px] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#f5f5f5] text-xl font-semibold">{editItem ? "Edit Discount" : "Create Discount"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#ababab] hover:text-red-400">
                <IoMdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#ababab] text-sm mb-1">Discount Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  required disabled={!!editItem}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#f6b100] font-mono uppercase"
                  placeholder="e.g. SAVE20" />
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-1">Discount Type *</label>
                <div className="flex gap-3">
                  {["percentage", "fixed"].map((t) => (
                    <button key={t} type="button" onClick={() => setForm((p) => ({ ...p, type: t }))}
                      className={`flex-1 py-3 rounded-lg font-semibold capitalize ${form.type === t ? "bg-indigo-700 text-white" : "bg-[#1f1f1f] text-[#ababab]"}`}>
                      {t === "percentage" ? "% Percentage" : "₹ Fixed Amount"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#ababab] text-sm mb-1">
                  Value * {form.type === "percentage" ? "(%)" : "(₹)"}
                </label>
                <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                  required min="0" max={form.type === "percentage" ? 100 : undefined}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#f6b100]"
                  placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 100"} />
              </div>

              {[
                { label: "Minimum Order Amount (₹)", key: "minOrderAmount", placeholder: "0 = no minimum" },
                { label: "Max Usage (0 = unlimited)", key: "maxUsage", placeholder: "0" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-[#ababab] text-sm mb-1">{label}</label>
                  <input type="number" min="0" value={form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
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
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-yellow-400" />
                <label htmlFor="isActive" className="text-[#ababab] text-sm">Active immediately</label>
              </div>

              <button type="submit" disabled={addMutation.isPending || updateMutation.isPending}
                className="w-full bg-[#f6b100] text-[#1f1f1f] py-3 rounded-lg font-bold disabled:opacity-60 mt-2">
                {editItem ? "Update Discount" : "Create Discount"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DiscountManager;
