// src/components/Dashboard/CompletedPieChart.jsx
import React from "react";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#DE7E5D", "rgba(90, 143, 123, 0.2)"]; // filled + transparent remainder

export default function CompletedPieChart({
  value,
  count,
  size = 140,       // chart size (width & height)
  innerRadius = 50, // inner radius (donut hole)
  outerRadius = 60, // outer radius (donut thickness)
  showCount = true  // whether to show "completed" text below percentage
}) {
  const chartData = [
    { name: "Filled", value: value },
    { name: "Remaining", value: 100 - value },
  ];

  return (
    <div className="relative flex justify-center items-center">
      <PieChart width={size} height={size}>
        <Pie
          data={chartData}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none" />
          ))}
        </Pie>
      </PieChart>

      {/* Centered Text */}
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        <span className="text-[#29445D] font-bold text-xl">{value}%</span>
        {showCount && (
          <span className="text-[#45767C] text-sm">completed</span>
        )}
      </div>
    </div>
  );
}
