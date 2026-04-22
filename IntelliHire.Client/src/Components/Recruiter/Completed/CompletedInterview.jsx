import React, { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
import { motion, useInView } from "framer-motion";
import SidebarCustom from "../../CommonComponents/SidebarCustom";
import ScheduledBars from "../Scheduled/ScheduledBars";
import CompletedInterviewCard from "./CompletedInterviewCard";
import { getDashboardData } from "../../../api/dashboard";
import CompletedPieChart from "../../Dashboard/CompletedPieChart";

const CompletedInterviews = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
        console.log("data in completed page",data)
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const interviews = dashboardData?.interviews || [];
  const completedInterviews = interviews.filter((i) => i.isCompleted);

  const barData =
    completedInterviews.reduce((acc, item) => {
      const existing = acc.find((a) => a.role === item.role);
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
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden">

      {/* SIDEBAR */}
      <div className="xs:w-0 sm:w-[10%] lg:mr-[5px]  sm:mr-[8%] flex justify-center md:justify-start">
        <SidebarCustom />
      </div>

      {/* MAIN */}
      <div className="w-full sm:w-[90%] flex flex-col gap-10">

        {/* TOP SECTION */}
        <motion.div
          ref={ref}
          className="flex flex-col lg:flex-row gap-8 w-full"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >

          {/* LEFT CARD */}
          <motion.div
            className="w-full flex flex-col"
            variants={itemVariants}
          >

            {/* HEADER */}
            <div className="flex sm:ml-[18%] lg:ml-0 items-center gap-3 mb-6">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="text-[#29445D]"
                size="2xl"
              />
              <h2
                className="text-4xl md:text-5xl text-[#29445D]"
                style={{ fontFamily: "Staatliches, monospace" }}
              >
                COMPLETED INTERVIEWS
              </h2>
            </div>

            {/* PIE CARD */}
            <div className="bg-[#F2FAF9] p-5   md:p-6 lg:p-6 rounded-2xl shadow-md flex flex-col xl:flex-row items-center justify-between gap-6
                            w-[80%] md:w-[70%] lg:w-[100%]  xl:w-[70%] mx-auto lg:mx-0">

              {/* PIE */}
              <div className="flex justify-center">
                <CompletedPieChart
                  value={parseFloat(completedPercentage)}
                  count={completedCount}
                  size={220}
                  innerRadius={70}
                  outerRadius={90}
                  showCount={false}
                />
              </div>

              {/* STATS */}
              <div className="flex flex-col gap-4 text-center lg:text-left min-w-[160px]">

                <div>
                  <h3 className="text-3xl font-bold text-[#29445D]">
                    {completedCount} / {total}
                  </h3>
                  <p className="text-[#45767C] text-sm">
                    Interviews Completed
                  </p>
                </div>

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

          {/* RIGHT BAR CHART */}
          <motion.div
            className=" w-full lg:w-[90%] xl:w-full xl:mt-[5%] flex justify-center"
            variants={itemVariants}
          >
            <ScheduledBars data={barData} />
          </motion.div>

        </motion.div>

        {/* BOTTOM SECTION */}
        <div className="w-full  px-6 pb-10">
          <h2 className="text-2xl md:text-3xl text-[#29445D] mb-6">
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