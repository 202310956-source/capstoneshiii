import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import { MiniCard } from "../components/home/HomeWidgets";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../https";

const Home = () => {
  useEffect(() => { document.title = "Transactease | Home"; }, []);

  const { data: ordersData } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });

  const orders = ordersData?.data.data || [];

  const totalRevenue = orders
    .filter((o) => o.orderStatus === "Completed")
    .reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);

  const activeOrders = orders.filter(
    (o) => o.orderStatus === "In Progress" || o.orderStatus === "Ready"
  ).length;

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex gap-3">
      <div className="flex-[3]">
        <Greetings />
        <div className="flex items-center w-full gap-3 px-8 mt-8">
          <MiniCard title="Total Earnings" icon={<BsCashCoin />} number={totalRevenue.toFixed(2)} footerNum={0} />
          <MiniCard title="In Progress"    icon={<GrInProgress />} number={activeOrders} footerNum={0} />
        </div>
        <RecentOrders />
      </div>
      <div className="flex-[2]">
        <PopularDishes />
      </div>
      <BottomNav />
    </section>
  );
};

export default Home;
