import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { formatDate } from "../../utils";

export const Greetings = () => {
  const userData = useSelector((state) => state.user);
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) =>
    `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;

  return (
    <div className="flex justify-between items-center px-8 mt-5">
      <div>
        <h1 className="text-[#f5f5f5] text-2xl font-semibold tracking-wide">
          Good Morning, {userData.name || "User"} 👋
        </h1>
        <p className="text-[#ababab] text-sm">Give your best services for customers 😀</p>
      </div>
      <div>
        <h1 className="text-[#f5f5f5] text-3xl font-bold tracking-wide">{formatTime(dateTime)}</h1>
        <p className="text-[#ababab] text-sm">{formatDate(dateTime)}</p>
      </div>
    </div>
  );
};

export const MiniCard = ({ title, icon, number, footerNum }) => (
  <div className="bg-[#1a1a1a] py-5 px-5 rounded-lg w-[50%]">
    <div className="flex items-start justify-between">
      <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">{title}</h1>
      <button className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-[#f6b100]"} p-3 rounded-lg text-[#f5f5f5] text-2xl`}>{icon}</button>
    </div>
    <div>
      <h1 className="text-[#f5f5f5] text-4xl font-bold mt-5">
        {title === "Total Earnings" ? `₹${number}` : number}
      </h1>
      <h1 className="text-[#f5f5f5] text-lg mt-2"><span className="text-[#02ca3a]">{footerNum}%</span> than yesterday</h1>
    </div>
  </div>
);
