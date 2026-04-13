import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login, POS, Dashboard, Inventory, Auth, Ingredients, Kiosk } from "./pages";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <POS />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <AdminRoute>
              <Inventory />
            </AdminRoute>
          }
        />
        <Route
          path="/ingredients"
          element={
            <AdminRoute>
              <Ingredients />
            </AdminRoute>
          }
        />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]"><p className="text-xl text-[#333333]">404 — Page Not Found</p></div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
