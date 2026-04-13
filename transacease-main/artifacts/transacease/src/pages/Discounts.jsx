import React, { useEffect } from "react";
import DiscountManager from "../components/discounts/DiscountManager";
import BackButton from "../components/shared/BackButton";

const Discounts = () => {
  useEffect(() => { document.title = "App | Discounts"; }, []);
  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)]">
      <div className="flex items-center gap-4 px-10 py-4">
        <BackButton />
        <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">Discounts</h1>
      </div>
      <DiscountManager />
    </section>
  );
};

export default Discounts;
