import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import { enqueueSnackbar } from "notistack";

const Tables = () => {
  const [status, setStatus] = useState("all");
  useEffect(() => { document.title = "App | Tables"; }, []);

  const { data: resData, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: () => getTables(),
    placeholderData: keepPreviousData,
  });

  if (isError) enqueueSnackbar("Something went wrong!", { variant: "error" });

  const allTables = resData?.data.data || [];
  const filtered = allTables.filter((t) => {
    if (status === "all") return true;
    if (status === "booked") return t.status === "Occupied" || t.status === "Booked";
    if (status === "available") return t.status === "Available";
    return true;
  });

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">Tables</h1>
        </div>
        <div className="flex items-center gap-4">
          {[
            { key: "all", label: "All" },
            { key: "booked", label: "Occupied" },
            { key: "available", label: "Available" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatus(key)}
              className={`text-[#ababab] text-lg rounded-lg px-5 py-2 font-semibold ${status === key ? "bg-[#383838]" : ""}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 px-16 py-4 h-[650px] overflow-y-scroll scrollbar-hide">
        {filtered.map((table) => (
          // Firestore: table.id not table._id
          <TableCard
            key={table.id}
            id={table.id}
            name={table.tableNo}
            status={table.status}
            initials={table.currentOrder?.customerDetails?.name}
            seats={table.seats}
          />
        ))}
      </div>
      <BottomNav />
    </section>
  );
};

export default Tables;
