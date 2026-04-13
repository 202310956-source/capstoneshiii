import React from "react";
import { FaSearch, FaUserCircle, FaBell } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => { dispatch(removeUser()); navigate("/auth"); },
    onError: (err) => console.log(err),
  });

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a]">
      <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
        <div className="h-8 w-8 bg-[#f6b100] rounded-full flex items-center justify-center text-black font-bold text-sm">R</div>
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">Restro</h1>
      </div>

      <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-5 py-2 w-[500px]">
        <FaSearch className="text-[#f5f5f5]" />
        <input type="text" placeholder="Search" className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full" />
      </div>

      <div className="flex items-center gap-4">
        {userData.role === "Admin" && (
          <div onClick={() => navigate("/dashboard")} className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer" title="Dashboard">
            <MdDashboard className="text-[#f5f5f5] text-2xl" />
          </div>
        )}
        <div className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer">
          <FaBell className="text-[#f5f5f5] text-2xl" />
        </div>
        <div className="flex items-center gap-3 cursor-pointer">
          <FaUserCircle className="text-[#f5f5f5] text-4xl" />
          <div className="flex flex-col items-start">
            <h1 className="text-md text-[#f5f5f5] font-semibold">{userData.name || "User"}</h1>
            <p className="text-xs text-[#ababab]">{userData.role || "Role"}</p>
          </div>
          <IoLogOut onClick={() => logoutMutation.mutate()} className="text-[#f5f5f5] ml-2 cursor-pointer" size={40} />
        </div>
      </div>
    </header>
  );
};

export default Header;
