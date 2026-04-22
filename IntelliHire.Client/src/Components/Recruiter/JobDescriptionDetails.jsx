import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import { getJobDescription, getJobInterviewStats } from "../../api/JobApi";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
} from "@fortawesome/free-solid-svg-icons";

import {
  BarChart3,
  Layers,
  Code2,
  ClipboardList,
  User
} from "lucide-react";

const JobDescriptionDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [stats, setStats] = useState(null);

  // ✅ FIX: scroll reset on page open
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchJob = async () => {
      const data = await getJobDescription(id);
      setJob(data);
    };

    const fetchStats = async () => {
      const data = await getJobInterviewStats(id);
      setStats(data);
    };

    fetchJob();
    fetchStats();
  }, [id]);

  // Animation configs
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        duration: 0.4,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  if (!job) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#D1DED3]">
        <div className="text-[#29445D] opacity-70 animate-pulse">
          Loading Job Details...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#D1DED3]">

      {/* SIDEBAR */}
      <div className="w-[10%]">
        <SidebarCustom />
      </div>

      {/* MAIN */}
      <motion.div
        className="w-[90%] px-10 py-8 space-y-10"
        variants={container}
        initial="hidden"
        animate="show"
      >

        {/* HEADER */}
        <motion.div
          variants={item}
          className="pb-6 border-b border-[#9CBFAC]"
        >
          <h1 className="text-4xl font-bold text-[#29445D] flex items-center gap-3">
            <FontAwesomeIcon icon={faBriefcase} />
            {job.JobRole}
          </h1>

          <p className="text-[#45767C] mt-2">
            Experience Required: {job.Experience}
          </p>
        </motion.div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-12">

            {/* DOMAINS */}
            <motion.section variants={item}>
              <h2 className="text-2xl font-bold text-[#29445D] flex items-center gap-2 mb-4">
                <Layers size={18} /> Domains
              </h2>

              <div className="flex flex-wrap gap-2">
                {job.Domains?.map((d) => (
                  <span
                    key={d.id}
                    className="px-3 py-1 bg-[#9CBFAC] text-[#29445D] rounded-full text-sm"
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            </motion.section>

            {/* TECH STACK */}
            <motion.section variants={item}>
              <h2 className="text-2xl font-bold text-[#29445D] flex items-center gap-2 mb-4">
                <Code2 size={18} /> Tech Stack
              </h2>

              <div className="flex flex-wrap gap-2">
                {job.TechStacks?.map((t) => (
                  <span
                    key={t.id}
                    className="px-3 py-1 border border-[#45767C] text-[#45767C] rounded-full text-sm"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </motion.section>

            {/* REQUIREMENTS */}
            {job.Requirements && (
              <motion.section variants={item}>
                <h2 className="text-2xl font-bold text-[#29445D] flex items-center gap-2 mb-4">
                  <ClipboardList size={18} /> Requirements
                </h2>

                <p className="text-[#29445D] leading-relaxed whitespace-pre-line pl-2 border-l-2 border-[#9CBFAC]">
                  {job.Requirements}
                </p>
              </motion.section>
            )}

          </div>

          {/* RIGHT SIDE */}
     <motion.div variants={item} className= "space-y-6 order-first lg:order-none"
>

  {/* OWNER */}
  <motion.div
    initial={{ opacity: 0, x: 30, scale: 0.95 }}
    whileInView={{ opacity: 1, x: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    whileHover={{ scale: 1.02 }}
    className="p-6 border border-[#9CBFAC] rounded-xl bg-[#F2FAF5] shadow-sm"
  >
    <h3 className="text-lg font-bold text-[#29445D] flex items-center gap-2 mb-3">
      <User size={18} /> Job Owner
    </h3>

    <p className="text-[#29445D] font-medium">
      {job.User?.fullName || "System User"}
    </p>

    <p className="text-sm text-[#45767C]">
      {job.User?.company || "Internal System"}
    </p>
  </motion.div>

  {/* ANALYTICS */}
  <motion.div
    initial={{ opacity: 0, x: 30, scale: 0.95 }}
    whileInView={{ opacity: 1, x: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
    whileHover={{ scale: 1.02 }}
    className="p-6 border border-[#9CBFAC] rounded-xl bg-[#F2FAF5] shadow-sm"
  >
    <h3 className="text-lg font-bold text-[#29445D] flex items-center gap-2 mb-4">
      <BarChart3 size={18} /> Interview Analytics
    </h3>

    <div className="space-y-3 text-sm">

      <div className="flex justify-between">
        <span className="text-[#45767C]">Total</span>
        <span className="font-semibold text-[#29445D]">
          {stats?.total || 0}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-[#45767C]">Scheduled</span>
        <span className="font-semibold text-[#45767C]">
          {stats?.scheduled || 0}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-[#45767C]">Completed</span>
        <span className="font-semibold text-green-600">
          {stats?.completed || 0}
        </span>
      </div>

    </div>
  </motion.div>

</motion.div>
        </div>

      </motion.div>
    </div>
  );
};

export default JobDescriptionDetails;