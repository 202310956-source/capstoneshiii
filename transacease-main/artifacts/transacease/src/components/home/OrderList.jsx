import React from "react";
import { FaCheckDouble, FaLongArrowAltRight, FaCircle } from "react-icons/fa";
import { getAvatarName } from "../../utils/index";

const OrderList = ({ order }) => (
  <div className="flex items-center gap-5 mb-3">
    <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
      {getAvatarName(order.customerDetails.name)}
    </button>
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col items-start gap-1">
        <h1 className="text-[#f5f5f5] text-lg font-semibold">{order.customerDetails.name}</h1>
        <p className="text-[#ababab] text-sm">{order.items.length} Items</p>
      </div>
      <h1 className="text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg p-1">
        Table <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {order.table?.tableNo ?? "—"}
      </h1>
      <div className="flex flex-col items-end gap-2">
        {order.orderStatus === "Ready" ? (
          <p className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg">
            <FaCheckDouble className="inline mr-2" /> {order.orderStatus}
          </p>
        ) : (
          <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg">
            <FaCircle className="inline mr-2" /> {order.orderStatus}
          </p>
        )}
      </div>
    </div>
  </div>
);

export default OrderList;
