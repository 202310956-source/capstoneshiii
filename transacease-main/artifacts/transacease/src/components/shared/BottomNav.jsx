import React, { useState } from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isActive = (path) => location.pathname === path;
  const increment = () => { if (guestCount < 6) setGuestCount((p) => p + 1); };
  const decrement = () => { if (guestCount > 0) setGuestCount((p) => p - 1); };

  const handleCreateOrder = () => {
    dispatch(setCustomer({ name, phone, guests: guestCount }));
    setIsModalOpen(false);
    navigate("/tables");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-16 flex justify-around">
      {[
        { path: "/",       label: "Home",   Icon: FaHome },
        { path: "/orders", label: "Orders", Icon: MdOutlineReorder },
        { path: "/tables", label: "Tables", Icon: MdTableBar },
      ].map(({ path, label, Icon }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`flex items-center justify-center font-bold ${
            isActive(path) ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } w-[300px] rounded-[20px]`}
        >
          <Icon className="inline mr-2" size={20} />
          <p>{label}</p>
        </button>
      ))}

      <button className="flex items-center justify-center font-bold text-[#ababab] w-[300px]">
        <span className="text-sm">More</span>
      </button>

      <button
        disabled={isActive("/tables") || isActive("/menu")}
        onClick={() => setIsModalOpen(true)}
        className="absolute bottom-6 bg-[#F6B100] text-[#f5f5f5] rounded-full p-4"
      >
        <BiSolidDish size={40} />
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Order">
        <div>
          <label className="block text-[#ababab] mb-2 text-sm font-medium">Customer Name</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Enter customer name" className="bg-transparent flex-1 text-white focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">Customer Phone</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="number" placeholder="+91-9999999999" className="bg-transparent flex-1 text-white focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block mb-2 mt-3 text-sm font-medium text-[#ababab]">Guests</label>
          <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg">
            <button onClick={decrement} className="text-yellow-500 text-2xl">&minus;</button>
            <span className="text-white">{guestCount} Person</span>
            <button onClick={increment} className="text-yellow-500 text-2xl">&#43;</button>
          </div>
        </div>
        <button onClick={handleCreateOrder} className="w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-8 hover:bg-yellow-700">
          Create Order
        </button>
      </Modal>
    </div>
  );
};

export default BottomNav;
