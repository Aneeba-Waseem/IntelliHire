import React from "react";

export default function MultiSelectField({ label, options, value, setValue, error }) {
  return (
    <div>
      <label className="block font-bold text-[#29445D]">{label}</label>
      <div className="flex flex-wrap gap-2 p-2 rounded-md bg-[#D1DED3] border border-[#9CBFAC] focus-within:ring-1 focus-within:ring-[#45767C]">
        {/* Selected tags */}
        {value.map((v) => (
          <span
            key={v}
            className="flex items-center bg-[#29445D] text-white px-2 py-1 rounded-full text-sm"
          >
            {v}
            <button
              type="button"
              onClick={() => setValue(value.filter((x) => x !== v))}
              className="ml-1 font-bold"
            >
              ×
            </button>
          </span>
        ))}

        {/* Dropdown */}
        <select
          value=""
          onChange={(e) => {
            const val = e.target.value;
            if (val && !value.includes(val)) setValue([...value, val]);
          }}
          className="bg-transparent flex-1 outline-none text-sm"
        >
          <option value="" disabled>
            Select {label.toLowerCase()}
          </option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.name}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
