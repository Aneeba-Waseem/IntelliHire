import React, { useRef } from "react";
import ScheduledPieChart from "./ScheduledPieChart";
import DashboardCarousel from "./DashboardCarousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
// import { scheduledInterviews } from "./Data";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Pointer } from "lucide-react";
const COLORS = [
  "#5A8F7B",
  "#16A085",
  "#F4C542",
  "#E44D3A",
  "#4C9FBD",
  "#2C3E91",
  "#9B59B6",
  
];
export default function DashBoardScheduled({ data }) {
    const navigate = useNavigate();

  const interviews = data?.interviews || [];

  const scheduledInterviews = interviews.filter(i => !i.isCompleted);
  // const completedInterviews = interviews.filter(i => i.isCompleted);
  const roleMap = {};

  scheduledInterviews.forEach((i) => {
    const role = i.JobDescription?.JobRole || i.role; // adjust based on your API
    if (!role) return;

    if (!roleMap[role]) {
      roleMap[role] = 0;
    }

    roleMap[role]++;
  });

  const chartData = Object.keys(roleMap).map((role) => ({
    name: role,
    value: roleMap[role],
  }));
  console.log("chart data in dashboard scheduled", chartData  )
  const total = scheduledInterviews.length;

  const getPercent = (value) => {
    if (!total) return 0;
    return ((value / total) * 100).toFixed(1);
  };
  console.log(" in dashboard scheduled", total)

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
              {total}
            </motion.span>
          </motion.div>

          <motion.div className="sm:flex flex-col gap-4 w-full sm:w-[45%] text-left text-sm text-[#29445D] leading-snug">
            {chartData.map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <span style={{ color: COLORS[index % COLORS.length] }} className="text-lg  block mb-1">
                  {getPercent(item.value)}% {item.name}
                </span>

                <p className="text-sm opacity-70">
                  {item.value} interviews
                </p>
              </motion.div>
            ))}
          </motion.div>


        </motion.div>
      </motion.div>

      {/* Divider */}
      <motion.div className="hidden md:block w-[1px] bg-[#9CBFAC] rounded-full mx-1 self-stretch" variants={itemVariants} />

      {/* Right Section (Carousel) */}
      <motion.div className="w-full lg:w-[40%] xl:w-[50%] py-5 flex flex-col justify-between rounded-2xl" variants={itemVariants}>
        <DashboardCarousel
          data={scheduledInterviews}
        />

        {/* View All */}
        <motion.div className="flex justify-end mt-4" variants={itemVariants}>
          <button className="text-[#29445D] text-lg hover:underline"
            style={{cursor: "pointer"}}
            onClick={() => navigate("/ScheduledInterview")}
            >
            VIEW ALL &gt;&gt;
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
