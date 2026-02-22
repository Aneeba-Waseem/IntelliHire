import React, { useRef } from "react";
import ScheduledPieChart from "./ScheduledPieChart";
import CompletedPieChart from "./CompletedPieChart";
import DashboardCarousel from "./DashboardCarousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
import { scheduledInterviews } from "./Data";
import { motion, useInView } from "framer-motion";

export default function DashBoardCompleted() {
    const chartData = [
        { name: "Completed", value: 25, label: "25% LOREM" },
        { name: "Pending", value: 12.5, label: "12.5% LOREM" },
        { name: "Cancelled", value: 62.5, label: "62.5% LOREM" },
    ];

    const completedValue = 50;
    const completedCount = 10;

    // Create ref to detect if in view
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    // Framer Motion variants
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
            ref={ref}
            className="bg-[#DDE8E2] flex flex-col lg:flex-row items-start justify-between rounded-2xl px-8 py-10 w-full shadow-sm gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"} // Trigger only when visible
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
                        COMPLETED INTERVIEWS
                    </h2>
                </motion.div>

                {/* Chart + Labels */}
                <motion.div className="flex flex-col sm:flex-row rounded-2xl bg-[#F2FAF5] p-8 items-center justify-between w-full" variants={itemVariants}>
                    {/* Chart */}
                    <motion.div className="relative flex flex-col justify-center items-center w-[100%] md:w-[50%]" variants={itemVariants}>
                        <CompletedPieChart
                            title="Completed"
                            value={completedValue}
                            count={completedCount}
                            chartData={chartData}
                            size={300}
                            innerRadius={70}
                            outerRadius={90}
                        />
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
