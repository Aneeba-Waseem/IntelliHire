import React from "react";

export default function ScoreBar({ label, value, max }) {
  const percent = (value / max) * 100;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="capitalize">{label}</span>
          <span>{value}</span>
        </div>
      )}

      <div className="w-full h-3 bg-[#D1DED3] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#45767C] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}