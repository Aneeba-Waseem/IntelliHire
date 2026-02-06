// src/components/Dashboard/ScheduledBars.jsx
import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const barColors = ["#5A8F7B", "#F4C542", "#E44D3A", "#4C9FBD", "#2C3E91"]; // colors for bars

export default function ScheduledBars({ data }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const barVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: (i) => ({
      width: `${(data[i].count / Math.max(...data.map(d => d.count))) * 100}%`,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    }),
  };

  return (
    <motion.div
      ref={ref}
      className="flex flex-col gap-4 w-full"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {data.map((item, index) => (
        <motion.div
          key={index}
          className="flex items-center gap-2"
          custom={index}
          variants={barVariants}
        >
          {/* Number */}
          <span className="w-6 text-2xl font-semibold text-[#29445D]">{item.count}</span>

          {/* Bar */}
          <div className="flex-1 h-6 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-6 rounded-full"
              style={{
                backgroundColor: barColors[index % barColors.length],
              }}
            ></div>
          </div>

          {/* Role */}
          <span className="w-[120px] text-sm font-bold text-[#29445D] uppercase">
            {item.role}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
