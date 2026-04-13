import React, { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import { subscribeToProducts } from "../services/productService";
import { subscribeToTransactions } from "../services/transactionService";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const Dashboard = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(
      (nextProducts) => {
        setProducts(nextProducts);
        setLoadingProducts(false);
      },
      (error) => {
        setLoadingProducts(false);
        enqueueSnackbar(error.message || "Unable to load products.", { variant: "error" });
      },
    );

    const unsubscribeTransactions = subscribeToTransactions(
      (nextTransactions) => {
        setTransactions(nextTransactions);
        setLoadingTransactions(false);
      },
      (error) => {
        setLoadingTransactions(false);
        enqueueSnackbar(error.message || "Unable to load transactions.", { variant: "error" });
      },
    );

    return () => {
      unsubscribeProducts();
      unsubscribeTransactions();
    };
  }, []);

  const totalSales = useMemo(
    () => transactions.reduce((sum, transaction) => sum + Number(transaction.totalAmount ?? 0), 0),
    [transactions],
  );

  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock <= product.reorderLevel).length,
    [products],
  );

  const stats = useMemo(
    () => [
      { title: "Total Sales", value: currencyFormatter.format(totalSales), color: "#FF9F2B", icon: <span>PHP</span> },
      { title: "Total Orders", value: transactions.length.toString(), color: "#F54D4D", icon: <span>ORD</span> },
      { title: "Low Stock", value: lowStockCount.toString(), color: "#FFB91F", icon: <span>LOW</span> },
    ],
    [lowStockCount, totalSales, transactions.length],
  );

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
  const loading = loadingProducts || loadingTransactions;

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#333333]">
      <div className="flex">
        <Sidebar active="Dashboard" />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold font-poppins">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Overview of sales, orders and inventory.</p>
            </div>
            <button className="rounded-xl bg-[#FFD23F] px-4 py-2 font-semibold text-[#333333] hover:bg-[#ffcf3f]">
              Live Firestore Data
            </button>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <StatsCard key={stat.title} title={stat.title} value={loading ? "Loading..." : stat.value} color={stat.color} icon={stat.icon} />
            ))}
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-3 text-lg font-semibold">Sales Trend</h2>
              <div className="flex h-64 flex-col justify-between rounded-lg border border-dashed border-gray-300 bg-[#fff3d6] p-6 text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-[#333333]">Realtime summary</p>
                  <p className="mt-1">
                    {loading
                      ? "Waiting for Firestore snapshots..."
                      : `${transactions.length} orders recorded with ${currencyFormatter.format(totalSales)} in sales.`}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Products</p>
                    <p className="mt-2 text-2xl font-bold text-[#333333]">{loading ? "-" : products.length}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Low Stock Items</p>
                    <p className="mt-2 text-2xl font-bold text-[#333333]">{loading ? "-" : lowStockCount}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Latest Order</p>
                    <p className="mt-2 text-sm font-bold text-[#333333]">
                      {recentTransactions[0]?.createdAt?.toDate
                        ? dateTimeFormatter.format(recentTransactions[0].createdAt.toDate())
                        : "No orders yet"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-3 text-lg font-semibold">Recent Transactions</h2>
              {loading ? (
                <p className="text-sm text-gray-500">Loading transactions...</p>
              ) : recentTransactions.length === 0 ? (
                <p className="text-sm text-gray-500">No transactions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {recentTransactions.map((transaction) => (
                    <li key={transaction.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{transaction.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-gray-500">
                          {transaction.createdAt?.toDate ? dateTimeFormatter.format(transaction.createdAt.toDate()) : "Pending time"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm">
                          Amount: <strong>{currencyFormatter.format(transaction.totalAmount)}</strong>
                        </span>
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">{transaction.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
