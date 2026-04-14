import React, { useRef, useState, useEffect } from "react";
import ScheduledPieChart from "../../Dashboard/ScheduledPieChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
import { motion, useInView } from "framer-motion";
import SidebarCustom from "../../CommonComponents/SidebarCustom";
import ScheduledBars from "./ScheduledBars";
import ScheduledInterviewCard from "./ScheduledInterviewCard";
import { getDashboardData } from "../../../api/dashboard";

const ScheduledInterviews = () => {


    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.2, duration: 0.6, ease: "easeOut" },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const numberVariants = {
        hidden: { scale: 0 },
        visible: { scale: 1, transition: { duration: 0.5, ease: "backOut" } },
    };
    
      // ✅ FIX: scroll reset on page open
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

    const scheduledInterviews = interviews.filter(i => !i.isCompleted);
    // const completedInterviews = interviews.filter(i => i.isCompleted);
    const roleMap = {};
    console.log("scheduled interviews in scheduled interview page", scheduledInterviews)
    
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

    const barData =
        scheduledInterviews?.reduce((acc, item) => {
            const existing = acc.find(a => a.role === item.role);
            if (existing) {
                existing.count++;
            } else {
                acc.push({ role: item.role, count: 1 });
            }
            return acc;
        }, []) || [];

   
const handleViewProfile = (profile) => {
  openModal(<CandidateProfileModal profile={profile} />);
};
    return (
        <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden">

            {/* Sidebar */}
            <div className="w-[10%] flex justify-center md:justify-start">
                <SidebarCustom />
            </div>

            {/* Right Section */}
            <div className="w-[90%] flex flex-col gap-10">

                {/* 🔹 TOP SECTION (Graph + Bars) */}
                <div className="w-full flex justify-center">
                    <motion.div
                        ref={ref}
                        className="flex flex-col lg:flex-row items-start justify-between rounded-2xl px-4 sm:px-8 py-10 gap-8 w-full"
                        variants={containerVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >
                        {/* LEFT (Chart) */}
                        <motion.div
                            className="w-full lg:w-[50%] xl:w-[40%] flex flex-col items-center"
                            variants={itemVariants}
                        >
                            {/* Header */}
                            <motion.div
                                className="flex items-center gap-3 mb-6 self-start"
                                variants={itemVariants}
                            >
                                <FontAwesomeIcon
                                    icon={faCalendarCheck}
                                    className="text-[#29445D]"
                                    size="2xl"
                                />
                                <h2
                                    className="text-4xl md:text-5xl text-[#29445D]"
                                    style={{ fontFamily: "Staatliches, monospace" }}
                                >
                                    SCHEDULED INTERVIEWS
                                </h2>
                            </motion.div>

                            {/* Chart */}
                            <motion.div
                                className="flex justify-center items-center w-full"
                                variants={itemVariants}
                            >
                                <div className="relative">
                                    <ScheduledPieChart
                                        chartData={chartData}
                                        size={300}
                                        innerRadius={130}
                                        outerRadius={150}
                                    />
                                    <motion.span
                                        className="absolute inset-0 flex items-center justify-center text-6xl text-[#29445D] font-bold"
                                        variants={numberVariants}
                                    >
                                        {scheduledInterviews.length}
                                    </motion.span>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* RIGHT (Bars) */}
                        <motion.div
                            className="mt-30 w-full lg:w-[100%] xl:w-[50%] flex justify-center"
                            variants={itemVariants}
                        >
                            <ScheduledBars data={barData} />
                        </motion.div>
                    </motion.div>
                </div>

                {/* 🔹 BOTTOM SECTION (Cards) */}
                <div className="w-full px-6 pb-10">

                    {/* Heading */}
                    <h2 className="text-3xl text-[#29445D] mb-6">
                        Upcoming Interviews
                    </h2>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scheduledInterviews.map((item) => (
                            <ScheduledInterviewCard
                                key={item.id}
                                interview={item}
                                onViewProfile={handleViewProfile}
                            />
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ScheduledInterviews;