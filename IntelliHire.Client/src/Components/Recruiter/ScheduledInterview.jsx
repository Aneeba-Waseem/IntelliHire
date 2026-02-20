import React, { useRef } from "react";
import ScheduledPieChart from "../Dashboard/ScheduledPieChart";
// import DashboardCarousel from "../Dashboard/DashboardCarousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
// import { scheduledInterviews } from "./Data";
import { motion, useInView } from "framer-motion";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import ScheduledBars from "./ScheduledBars";
const ScheduledInterviews = () => {
    const chartData = [
        { name: "Completed", value: 8 },
        { name: "Pending", value: 10},
        { name: "Cancelled", value: 8},
        { name: "Completed", value: 6  },
        { name: "Completed", value: 4 },
    ];
    const barData = [
        { count: 8, role: "WEB DEVELOPER" },
        { count: 10, role: "AI Engineer" },
        { count: 8, role: "Software Engineer" },
        { count: 6, role: "Full Stavk Engineer" },
        { count: 4, role: "Associate Developer" },
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
        <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden ">

            {/* Left Sidebar (10%) */}
          <div className="w-[10%] flex justify-center md:justify-start mb-0">
        <SidebarCustom />
      </div>

            {/* Right Side (90%) split into two equal parts) */}
            <div className="w-[90%] min-w-[80px] flex items-around justify-center">

                <motion.div
                    ref={ref}  // attach ref
                    className=" flex flex-col lg:flex-row items-start justify-between rounded-2xl px-4 sm:px-8 py-10 gap-8 w-full"
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
                                size="2xl"
                            />
                            <h2
                                className="text-5xl text-[#29445D] tracking-wide"
                                style={{ fontFamily: "Staatliches, monospace" }}
                            >
                                SCHEDULED INTERVIEWS
                            </h2>
                        </motion.div>

                        {/* Chart + Labels */}
                        <motion.div className="flex flex-col sm:flex-row rounded-2xl p-6 sm:p-8 items-center justify-center w-full" variants={itemVariants}>
                            {/* Chart */}
                            <motion.div className="relative flex flex-col justify-center items-center w-full sm:w-[50%] mb-6 sm:mb-0" variants={itemVariants}>
                                <ScheduledPieChart
                                    chartData={chartData}
                                    size={300}
                                    innerRadius={130}
                                    outerRadius={150}
                                />
                                <motion.span className="absolute text-7xl text-[#29445D] font-bold" variants={numberVariants}>
                                    35
                                </motion.span>
                            </motion.div>


                        </motion.div>
                    </motion.div>

                    {/* Right Section (Carousel) */}
                    <motion.div className="w-full mr-30 mt-30 lg:w-[40%] xl:w-[50%] py-5 flex flex-col justify-between rounded-2xl" variants={itemVariants}>
                        <ScheduledBars data={barData} />
                    </motion.div>
                </motion.div>


            </div>

        </div>
    )
}

export default ScheduledInterviews
