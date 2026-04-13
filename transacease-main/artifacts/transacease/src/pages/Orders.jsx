import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack";

const Orders = () => {
  const [status, setStatus] = useState("all");
  useEffect(() => { document.title = "App | Orders"; }, []);

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
    placeholderData: keepPreviousData,
  });

  if (isError) enqueueSnackbar("Something went wrong!", { variant: "error" });

  const allOrders = resData?.data.data || [];
  const filtered = allOrders.filter((o) => {
    if (status === "all") return true;
    if (status === "progress") return o.orderStatus === "In Progress";
    if (status === "ready") return o.orderStatus === "Ready";
    if (status === "completed") return o.orderStatus === "Completed";
    return true;
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "progress", label: "In Progress" },
    { key: "ready", label: "Ready" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">Orders</h1>
        </div>
        <div className="flex items-center gap-4">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setStatus(key)}
              className={`text-[#ababab] text-lg rounded-lg px-5 py-2 font-semibold ${status === key ? "bg-[#383838]" : ""}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-16 py-4 overflow-y-scroll scrollbar-hide h-[calc(100vh-10rem)]">
        {filtered.length > 0
          ? filtered.map((order) => (
              // Firestore: order.id not order._id
              <OrderCard key={order.id || order._id} order={order} />
            ))
          : <p className="col-span-3 text-gray-500 text-center mt-10">No orders found</p>}
      </div>
      <BottomNav />
    </section>
  );
};

export default Orders;
