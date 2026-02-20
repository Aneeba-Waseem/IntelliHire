import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck, faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import ScheduledPieChart from "./ScheduledPieChart";
import CompletedPieChart from "./CompletedPieChart";
import { motion, useInView } from "framer-motion";

export default function DashBoardCard({ title, value, chartData, count, chartSize }) {
  const isScheduled = title === "Scheduled";

  // Ref for in-view detection
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const iconVariants = {
    hidden: { scale: 0 },
    visible: { scale: 1, transition: { duration: 0.5, ease: "backOut" } },
  };

  const numberVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } },
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, delay: 0.5 } },
  };

  return (
    <motion.div
      ref={ref} // attach ref
      className="
        bg-[#DDE8E2] 
        flex flex-col sm:flex-row 
        items-center justify-between 
        rounded-lg 
        px-4 sm:px-6 py-6 sm:py-12 
        w-[95%] 
        shadow-sm
        gap-4 sm:gap-0
      "
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"} // trigger only when visible
    >
      {/* Left Icon */}
      <motion.div
        className="flex items-center justify-center w-[60px]"
        variants={iconVariants}
      >
        <FontAwesomeIcon
          icon={isScheduled ? faCalendarCheck : faCircleCheck}
          className="text-[#29445D]"
          size="3x"
        />
      </motion.div>

      {/* For small screens: Chart */}
      <div className="flex sm:hidden justify-center items-center w-[80px]">
        {isScheduled ? (
          <ScheduledPieChart chartData={chartData} size={chartSize} />
        ) : (
          <CompletedPieChart value={value} count={count} size={chartSize} />
        )}
      </div>

      {/* Center Text */}
      <motion.div
        className="
          flex flex-col items-center justify-center text-center flex-1
          sm:order-none order-3
        "
        style={{ fontFamily: "Staatliches, monospace" }}
        variants={numberVariants}
      >
        <motion.span
          className="text-5xl sm:text-6xl text-[#29445D]"
          variants={numberVariants}
        >
          {isScheduled ? value : count}
        </motion.span>
        <motion.span
          className="text-xl sm:text-2xl tracking-wider text-[#29445D] uppercase"
          variants={textVariants}
        >
          {isScheduled ? "Scheduled" : "Completed"}
        </motion.span>
      </motion.div>

      {/* Right Chart */}
      <div className="hidden sm:flex justify-center items-center w-[100px]">
        {isScheduled ? (
          <ScheduledPieChart chartData={chartData} size={chartSize} />
        ) : (
          <CompletedPieChart value={value} count={count} size={chartSize} />
        )}
      </div>
    </motion.div>
  );
}
