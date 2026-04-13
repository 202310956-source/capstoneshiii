import React, { useState } from "react";

const PasswordInput = ({ label, error, className = "", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-[#333333]">{label}</label>
      <div
        className={`flex items-center rounded-xl border bg-white px-4 py-3 transition ${
          error ? "border-[#E53935]" : "border-gray-200 focus-within:border-[#FFD23F]"
        }`}
      >
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          className="w-full bg-transparent text-sm text-[#333333] outline-none"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="ml-3 text-sm font-semibold text-[#E53935]"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-[#E53935]">{error}</p> : null}
    </div>
  );
};

export default PasswordInput;
