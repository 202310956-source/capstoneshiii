import React, { useState, useEffect } from "react";
import { useSnackbar } from "notistack";
import Sidebar from "../components/Sidebar";
import { subscribeToTransactions, updateTransactionStatus } from "../services/transactionService";

const currencyFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

const STATUS_TABS = ["All", "Pending", "Ready", "Completed"];

const statusStyle = {
  Pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  Ready: "bg-blue-100 text-blue-700 border border-blue-300",
  Completed: "bg-green-100 text-green-700 border border-green-300",
};

const formatDate = (createdAt) => {
  if (!createdAt) return "—";
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  return date.toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const OrderCard = ({ order, onUpdateStatus }) => {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (newStatus) => {
    setUpdating(true);
    await onUpdateStatus(order.id, newStatus);
    setUpdating(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium">
            {order.source === "kiosk" ? `Queue #${order.queueNumber ?? "—"}` : `POS Order`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[order.status] ?? "bg-gray-100 text-gray-600"}`}>
          {order.status}
        </span>
      </div>

      <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
        {(order.items ?? []).map((item, i) => (
          <div key={i} className="flex justify-between text-sm text-gray-700">
            <span>{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
            <span>{currencyFormatter.format(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-[#333]">
        <span>Total</span>
        <span>{currencyFormatter.format(order.totalAmount)}</span>
      </div>

      {order.discountType !== "none" && order.discountAmount > 0 && (
        <p className="text-xs text-green-600">Discount ({order.discountType}): -{currencyFormatter.format(order.discountAmount)}</p>
      )}

      <div className="flex gap-2 mt-1">
        {order.status === "Pending" && (
          <button
            disabled={updating}
            onClick={() => handleUpdate("Ready")}
            className="flex-1 rounded-xl bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
          >
            {updating ? "Updating…" : "Mark Ready"}
          </button>
        )}
        {order.status === "Ready" && (
          <button
            disabled={updating}
            onClick={() => handleUpdate("Completed")}
            className="flex-1 rounded-xl bg-green-500 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
          >
            {updating ? "Updating…" : "Mark Completed"}
          </button>
        )}
        {order.status === "Completed" && (
          <span className="flex-1 text-center py-2 text-xs text-gray-400">Order fulfilled</span>
        )}
      </div>
    </div>
  );
};

const Orders = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    document.title = "TransactEase | Orders";
    const unsubscribe = subscribeToTransactions(
      (txns) => { setTransactions(txns); setLoading(false); },
      (err) => { setLoading(false); enqueueSnackbar(err.message || "Failed to load orders.", { variant: "error" }); },
    );
    return unsubscribe;
  }, []);

  const filtered = transactions.filter((t) => filter === "All" || t.status === filter);

  const counts = {
    All: transactions.length,
    Pending: transactions.filter((t) => t.status === "Pending").length,
    Ready: transactions.filter((t) => t.status === "Ready").length,
    Completed: transactions.filter((t) => t.status === "Completed").length,
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateTransactionStatus(id, newStatus);
      enqueueSnackbar(`Order marked as ${newStatus}.`, { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message || "Failed to update order.", { variant: "error" });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#333333]">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{transactions.length} total orders</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === tab
                  ? "bg-[#333333] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${filter === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400 text-center mt-20">Loading orders…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-center mt-20">No {filter !== "All" ? filter.toLowerCase() : ""} orders found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
