import React, { useRef } from "react";
import ScheduledPieChart from "./ScheduledPieChart";
import DashboardCarousel from "./DashboardCarousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
import { scheduledInterviews } from "./Data";
import { motion, useInView } from "framer-motion";

export default function DashBoardScheduled() {
  const chartData = [
    { name: "Completed", value: 25, label: "25% LOREM" },
    { name: "Pending", value: 12.5, label: "12.5% LOREM" },
    { name: "Cancelled", value: 62.5, label: "62.5% LOREM" },
  ];

  // Ref for in-view detection
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { staggerChildren: 0.2, duration: 0.6, ease: "easeOut" } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const numberVariants = {
    hidden: { scale: 0 },
    visible: { scale: 1, transition: { duration: 0.5, ease: "backOut" } },
  };

  return (
    <motion.div
      ref={ref}  // attach ref
      className="bg-[#DDE8E2] flex flex-col lg:flex-row items-start justify-between rounded-2xl px-4 sm:px-8 py-10 shadow-sm gap-8 w-full"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"} // animate only when in view
    >
      {/* Left Section (Chart) */}
      <motion.div 
        className="w-full lg:w-[50%] xl:w-[40%] flex flex-col justify-center items-center"
        variants={itemVariants}
      >
        {/* Header */}
        <motion.div className="flex items-center gap-3 mb-6 self-start" variants={itemVariants}>
          <FontAwesomeIcon
            icon={faCalendarCheck}
            className="text-[#29445D]"
            size="lg"
          />
          <h2
            className="text-2xl text-[#29445D] tracking-wide"
            style={{ fontFamily: "Staatliches, monospace" }}
          >
            SCHEDULED INTERVIEWS
          </h2>
        </motion.div>

        {/* Chart + Labels */}
        <motion.div className="flex flex-col sm:flex-row rounded-2xl bg-[#F2FAF5] p-6 sm:p-8 items-center justify-between w-full" variants={itemVariants}>
          {/* Chart */}
          <motion.div className="relative flex flex-col justify-center items-center w-full sm:w-[50%] mb-6 sm:mb-0" variants={itemVariants}>
            <ScheduledPieChart
              chartData={chartData}
              size={300}
              innerRadius={70}
              outerRadius={90}
            />
            <motion.span className="absolute text-4xl text-[#29445D] font-bold" variants={numberVariants}>
              20
            </motion.span>
          </motion.div>

          {/* Percentage Labels */}
          <motion.div className="sm:flex flex-col gap-4 w-full sm:w-[45%] text-left text-sm text-[#29445D] leading-snug" variants={itemVariants}>
            <motion.div variants={itemVariants}>
              <span className="text-[#E44D3A] font-bold block mb-1">25% LOREM</span>
              <p className="text-xs opacity-70">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <span className="text-[#F4C542] font-bold block mb-1">12.5% LOREM</span>
              <p className="text-xs opacity-70">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <span className="text-[#5A8F7B] font-bold block mb-1">62.5% LOREM</span>
              <p className="text-xs opacity-70">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div className="hidden md:block w-[1px] bg-[#9CBFAC] rounded-full mx-1 self-stretch" variants={itemVariants} />

      {/* Right Section (Carousel) */}
      <motion.div className="w-full lg:w-[40%] xl:w-[50%] py-5 flex flex-col justify-between rounded-2xl" variants={itemVariants}>
        <DashboardCarousel
          title="Scheduled Interviews"
          icon="fa-regular fa-calendar-check"
          data={scheduledInterviews}
        />

        {/* View All */}
        <motion.div className="flex justify-end mt-4" variants={itemVariants}>
          <button className="text-[#29445D] text-lg hover:underline">
            VIEW ALL &gt;&gt;
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
