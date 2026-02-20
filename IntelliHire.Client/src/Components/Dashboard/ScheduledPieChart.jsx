// src/components/Dashboard/ScheduledPieChart.jsx
import React from "react";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#5A8F7B", "#F4C542", "#E44D3A","#4C9FBD", "#2C3E91"]; // Completed, Pending, Cancelled

export default function ScheduledPieChart({
  chartData,
  size = 140,       // chart size
  innerRadius = 50, // inner hole radius
  outerRadius = 70, // outer boundary
  paddingAngle = 2  // gap between segments
}) {
  return (
    <PieChart width={size} height={size}>
      <Pie
        data={chartData}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={90}
        endAngle={-270}
        dataKey="value"
        paddingAngle={paddingAngle}
      >
        {chartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}
