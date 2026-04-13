import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7] text-[#333333]">
    <p className="text-sm font-medium">Loading account...</p>
  </div>
);

const AdminRoute = ({ children }) => {
  const { user, role, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== "admin") {
    return <Navigate to="/pos" replace />;
  }

  return children;
};

export default AdminRoute;
