import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password, true);
      enqueueSnackbar("Login successful.", { variant: "success" });
      navigate(result.role === "admin" ? "/dashboard" : "/pos");
    } catch (err) {
      const message = err.message || "Login failed. Please check your credentials.";
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#ababab]">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="employee@restaurant.com"
          className="w-full rounded-lg border border-[#333] bg-[#252525] px-3 py-2.5 text-sm text-[#f5f5f5] transition-colors focus:border-[#f6b100] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#ababab]">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          className="w-full rounded-lg border border-[#333] bg-[#252525] px-3 py-2.5 text-sm text-[#f5f5f5] transition-colors focus:border-[#f6b100] focus:outline-none"
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#f6b100] py-2.5 text-sm font-bold text-[#1a1a1a] transition-colors hover:bg-yellow-400 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};

export default Login;
