import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#45767C", "#9CBFAC", "#29445D", "#6FA8A0"];

export default function DomainChart({ data }) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <PieChart width={200} height={200}>
      <Pie
        data={chartData}
        cx="50%"
        cy="50%"
        outerRadius={70}
        dataKey="value"
      >
        {chartData.map((entry, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );
}