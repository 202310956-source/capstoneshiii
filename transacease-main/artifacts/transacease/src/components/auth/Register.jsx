import React, { useState } from "react";
import { useSnackbar } from "notistack";
import { useAuth } from "../../context/AuthContext";

const Register = ({ setIsRegister }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { register } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role: "staff",
      });

      setSuccess("Account created! You can now sign in.");
      enqueueSnackbar("Account created successfully.", { variant: "success" });
      setTimeout(() => setIsRegister(false), 1200);
    } catch (err) {
      const message = err.message || "Registration failed.";
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#ababab]">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your Name"
          className="w-full rounded-lg border border-[#333] bg-[#252525] px-3 py-2.5 text-sm text-[#f5f5f5] transition-colors focus:border-[#f6b100] focus:outline-none"
        />
      </div>
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
          placeholder="At least 6 characters"
          className="w-full rounded-lg border border-[#333] bg-[#252525] px-3 py-2.5 text-sm text-[#f5f5f5] transition-colors focus:border-[#f6b100] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#ababab]">Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Repeat password"
          className="w-full rounded-lg border border-[#333] bg-[#252525] px-3 py-2.5 text-sm text-[#f5f5f5] transition-colors focus:border-[#f6b100] focus:outline-none"
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-green-400">{success}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#f6b100] py-2.5 text-sm font-bold text-[#1a1a1a] transition-colors hover:bg-yellow-400 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
};

export default Register;
