import React, { useEffect, useState } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu } from "react-icons/md";
import MenuContainer from "../components/menu/MenuContainer";
import CartSidebar, { CartToggleButton } from "../components/menu/CartSidebar";
import { useSelector } from "react-redux";

const Menu = () => {
  useEffect(() => { document.title = "App | Menu"; }, []);
  const customerData = useSelector((state) => state.customer);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">Menu</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MdRestaurantMenu className="text-[#686868] text-xl" />
            <div>
              <p className="text-sm text-[#f5f5f5] font-semibold leading-none">{customerData.customerName || "Customer"}</p>
              <p className="text-xs text-[#686868] mt-0.5">Table: {customerData.table?.tableNo || "N/A"}</p>
            </div>
          </div>
          <CartToggleButton onClick={() => setCartOpen(true)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <MenuContainer />
      </div>

      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <BottomNav />
    </section>
  );
};

export default Menu;
