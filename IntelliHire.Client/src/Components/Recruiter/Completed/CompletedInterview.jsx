import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
import { motion, useInView } from "framer-motion";
import SidebarCustom from "../../CommonComponents/SidebarCustom";
import ScheduledBars from "../Scheduled/ScheduledBars"
import CompletedInterviewCard from "./CompletedInterviewCard";
import { getDashboardData } from "../../../api/dashboard";
import CompletedPieChart from "../../Dashboard/CompletedPieChart";

const CompletedInterviews = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
        useEffect(() => {
            window.scrollTo(0, 0);
          }, []);
          
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDashboardData();
                setDashboardData(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const interviews = dashboardData?.interviews || [];
    const completedInterviews = interviews.filter(i => i.isCompleted);

    // Role mapping
    const roleMap = {};
    completedInterviews.forEach((i) => {
        const role = i.JobDescription?.JobRole || i.role;
        if (!role) return;

        if (!roleMap[role]) roleMap[role] = 0;
        roleMap[role]++;
    });

    const chartData = Object.keys(roleMap).map((role) => ({
        name: role,
        value: roleMap[role],
    }));

    const barData =
        completedInterviews.reduce((acc, item) => {
            const existing = acc.find(a => a.role === item.role);
            if (existing) {
                existing.count++;
            } else {
                acc.push({ role: item.role, count: 1 });
            }
            return acc;
        }, []) || [];

    const completedCount = completedInterviews.length;
    const total = interviews.length;
    const completedPercentage = total
        ? ((completedCount / total) * 100).toFixed(1)
        : 0;

    // animations
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.2, duration: 0.6 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="bg-[#D1DED3] w-full min-h-screen flex">

            {/* Sidebar */}
            <div className="w-[10%]">
                <SidebarCustom />
            </div>

            {/* Right Section */}
            <div className="w-[90%] flex flex-col gap-10">

                {/* 🔹 TOP GRAPH SECTION */}
                <div className="w-full flex justify-center">
                    <motion.div
                        ref={ref}
                        className="flex flex-col lg:flex-row items-start justify-between px-6 py-10 gap-8 w-full"
                        variants={containerVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >

                        {/* LEFT (Pie Chart) */}
                        <motion.div
                            className="w-full lg:w-[40%] flex flex-col"
                            variants={itemVariants}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6 self-start">
                                <FontAwesomeIcon
                                    icon={faCalendarCheck}
                                    className="text-[#29445D]"
                                    size="2xl"
                                />
                                <h2 className="text-4xl text-[#29445D] font-bold">
                                    COMPLETED INTERVIEWS
                                </h2>
                            </div>

                            {/* MAIN CARD */}
                            <div className="bg-[#F2FAF9] p-6 rounded-2xl shadow-md w-full flex items-center justify-between gap-6">

                                {/* 🔵 LEFT: DONUT */}
                                <div className="flex justify-center items-center">
                                    <CompletedPieChart
                                        value={parseFloat(completedPercentage)}
                                        count={completedCount}
                                        size={240}
                                        innerRadius={75}
                                        outerRadius={95}
                                        showCount={false}
                                    />
                                </div>

                                {/* 🔴 RIGHT: STATS */}
                                <div className="flex flex-col justify-center gap-4 text-left min-w-[180px]">

                                    {/* MAIN COUNT */}
                                    <div  className="">
                                        <h3 className=" text-4xl font-bold text-[#29445D]">
                                            {completedCount} / {total}
                                        </h3>
                                        <p className="text-[#45767C] text-sm">
                                            Interviews Completed
                                        </p>
                                    </div>

                                    {/* PERCENTAGE */}
                                    <div>
                                        <p className="text-lg font-semibold text-[#29445D]">
                                            {completedPercentage}%
                                        </p>
                                        <p className="text-xs text-[#45767C]">
                                            Completion Rate
                                        </p>
                                    </div>

                                </div>

                            </div>
                        </motion.div>

                        {/* RIGHT (Bars) */}
                        <motion.div
                            className="w-full mt-20 lg:w-[60%] flex justify-center"
                            variants={itemVariants}
                        >
                            <ScheduledBars data={barData} />
                        </motion.div>

                    </motion.div>
                </div>

                {/* 🔹 BOTTOM CARDS */}
                <div className="w-full px-6 pb-10">

                    <h2 className="text-3xl text-[#29445D] mb-6">
                        Completed Interviews
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedInterviews.map((item) => (
                            <CompletedInterviewCard
                                key={item.id}
                                interview={item}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CompletedInterviews;