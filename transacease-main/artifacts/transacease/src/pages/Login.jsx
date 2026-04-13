import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import InputField from "../components/InputField";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";

const validateLogin = ({ email, password }) => {
  const nextErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!emailPattern.test(email)) {
    nextErrors.email = "Invalid email format.";
  }

  if (!password) {
    nextErrors.password = "Password is required.";
  } else if (password.length < 6) {
    nextErrors.password = "Password must be at least 6 characters.";
  }

  return nextErrors;
};

const Spinner = () => <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#333333] border-t-transparent" />;

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { login, role, user, authLoading } = useAuth();

  const redirectPath = useMemo(() => {
    const requestedPath = location.state?.from?.pathname;

    if (requestedPath && role === "admin") {
      return requestedPath;
    }

    return role === "admin" ? "/dashboard" : "/pos";
  }, [location.state, role]);

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate(redirectPath, { replace: true });
    }
  }, [authLoading, navigate, redirectPath, role, user]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateLogin(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      enqueueSnackbar("Please fix the highlighted fields.", { variant: "warning" });
      return;
    }

    setLoading(true);

    try {
      const result = await login(form.email.trim(), form.password, form.rememberMe);
      enqueueSnackbar("Login successful.", { variant: "success" });
      navigate(result.role === "admin" ? "/dashboard" : "/pos", { replace: true });
    } catch (error) {
      enqueueSnackbar(error.message || "Login failed. Please check your credentials.", { variant: "error" });
      setErrors((current) => ({ ...current, form: error.message || "Login failed. Please check your credentials." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E53935] via-[#FF8C42] to-[#FFD23F]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_32%)]" />
          <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black">W</div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">Capstone Project</p>
                <h1 className="text-3xl font-bold font-poppins">TransactEase</h1>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Sales, Discount, and Inventory Management System</p>
              <h2 className="mt-4 text-5xl font-bold leading-tight font-poppins">
                Secure access for Wimpy&apos;s daily operations.
              </h2>
              <p className="mt-6 text-lg text-white/90">
                Monitor inventory, process sales, and manage staff access with one connected system.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
                <p className="text-white/70">Realtime</p>
                <p className="mt-2 text-xl font-bold">Dashboard</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
                <p className="text-white/70">Role-based</p>
                <p className="mt-2 text-xl font-bold">Access</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
                <p className="text-white/70">Connected</p>
                <p className="mt-2 text-xl font-bold">Inventory</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-[0_30px_80px_rgba(229,57,53,0.16)] transition duration-300 sm:p-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E53935] to-[#FF8C42] text-2xl font-black text-white lg:mx-0">
                W
              </div>
              <h2 className="text-3xl font-bold text-[#333333] font-poppins">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-500">Log in to continue to TransactEase.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@wimpy.com"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                error={errors.email}
              />

              <PasswordInput
                label="Password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                error={errors.password}
              />

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={(event) => updateField("rememberMe", event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#E53935] focus:ring-[#FFD23F]"
                  />
                  Remember me
                </label>

                <a href="mailto:support@wimpy.local?subject=Forgot%20Password" className="font-semibold text-[#E53935] transition hover:text-[#c53431]">
                  Forgot Password?
                </a>
              </div>

              {errors.form ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-[#E53935]">{errors.form}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FFD23F] px-4 py-3 font-bold text-[#333333] transition hover:bg-[#f4c72f] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 lg:text-left">
              Don&apos;t have an account?{" "}
              <Link to="/auth" className="font-semibold text-[#E53935] transition hover:text-[#c53431]">
                Sign Up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
