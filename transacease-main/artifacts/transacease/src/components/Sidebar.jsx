import React from "react";
import { Link } from "react-router-dom";
import { FaTachometerAlt, FaClipboardList, FaBoxes, FaPercent, FaCog, FaCarrot, FaTabletAlt } from "react-icons/fa";

const navItems = [
  { label: "Dashboard",   icon: FaTachometerAlt, path: "/dashboard" },
  { label: "Orders",      icon: FaClipboardList, path: "/orders" },
  { label: "Inventory",   icon: FaBoxes,         path: "/inventory" },
  { label: "Ingredients", icon: FaCarrot,        path: "/ingredients" },
  { label: "Discounts",   icon: FaPercent,       path: "/discounts" },
  { label: "Kiosk",       icon: FaTabletAlt,     path: "/kiosk" },
  { label: "Settings",    icon: FaCog,           path: "/settings" },
];

const Sidebar = ({ active = "Dashboard" }) => {
  return (
    <aside className="h-screen w-72 hidden lg:block bg-gradient-to-b from-[#E53935] via-[#FF8C42] to-[#FFD23F] text-white shadow-xl">
      <div className="p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">W</div>
          <div>
            <p className="font-bold text-lg">TransactEase</p>
            <p className="text-xs">Wimpy's POS</p>
          </div>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const activeClass = item.label === active ? "bg-white/20" : "hover:bg-white/10";
            return (
              <Link key={item.label} to={item.path} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${activeClass}`}>
                <Icon size={16} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
