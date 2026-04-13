import React from "react";
import { FaSearch } from "react-icons/fa";
import OrderList from "./OrderList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";

const RecentOrders = () => {
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
    placeholderData: keepPreviousData,
  });

  if (isError) enqueueSnackbar("Something went wrong!", { variant: "error" });

  return (
    <div className="px-8 mt-6">
      <div className="bg-[#1a1a1a] w-full h-[450px] rounded-lg">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold">Recent Orders</h1>
          <a href="/orders" className="text-[#025cca] text-sm font-semibold">View all</a>
        </div>
        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mx-6">
          <FaSearch className="text-[#f5f5f5]" />
          <input type="text" placeholder="Search recent orders" className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full" />
        </div>
        <div className="mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide">
          {resData?.data.data.length > 0
            ? resData.data.data.map((order) => (
                // Firestore uses 'id' not '_id'
                <OrderList key={order.id || order._id} order={order} />
              ))
            : <p className="text-gray-500 mt-4">No orders available</p>}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
