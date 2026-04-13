import React from "react";

const StatsCard = ({ title, value, icon, color }) => {
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <div className="h-9 w-9 rounded-lg bg-opacity-20 flex items-center justify-center" style={{ backgroundColor: color }}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-[#333333]">{value}</p>
    </div>
  );
};

export default StatsCard;
