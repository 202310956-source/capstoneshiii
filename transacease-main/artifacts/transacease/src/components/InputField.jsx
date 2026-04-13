import React from "react";

const InputField = ({ label, error, className = "", ...props }) => {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-[#333333]">{label}</label>
      <input
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#333333] outline-none transition ${
          error ? "border-[#E53935] focus:border-[#E53935]" : "border-gray-200 focus:border-[#FFD23F]"
        }`}
      />
      {error ? <p className="mt-2 text-xs text-[#E53935]">{error}</p> : null}
    </div>
  );
};

export default InputField;
