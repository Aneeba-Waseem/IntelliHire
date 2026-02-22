import React from "react";
import { motion as Motion } from "motion/react";
import robotImage from "../../assets/user/meetRobo.png";
import ews from "../../assets/companylogo/ews-logo.png";

const InterviewSchedule = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between w-full px-8 py-10 gap-10 overflow-hidden">

      {/* LEFT SECTION */}
      <Motion.div
        className="flex flex-col bg-[#45767C] rounded-3xl py-12 px-12 md:flex-row items-center md:items-start gap-6 w-full md:w-1/2 group shadow-[0_5px_30px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] transition-shadow duration-500"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Company Logo */}
        <Motion.div
          className="w-24 h-24 rounded-2xl bg-white shadow-inner border flex items-center justify-center transition-transform duration-300 hover:scale-105"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <img
            src={ews}
            alt="Company Logo"
            className="w-20 h-20 object-contain rounded-md"
          />
        </Motion.div>

        {/* Interview Info with smooth staggered animation */}
        <div className="flex flex-col justify-center gap-2 text-white">
          <Motion.p
            className="text-3xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
          >
            East West System
          </Motion.p>

          <Motion.p
            className="text-xl font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            viewport={{ once: true }}
          >
            Position: Frontend Developer
          </Motion.p>

          <Motion.p
            className="text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            viewport={{ once: true }}
          >
            Duration: 45 minutes
          </Motion.p>

          <Motion.p
            className="text-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            viewport={{ once: true }}
          >
            Mode: Remote Interview
          </Motion.p>
        </div>
      </Motion.div>

      {/* RIGHT SECTION (Robot Image) */}
      <Motion.div
        className="w-full md:w-1/2 flex justify-center"
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          delay: 0.2,
        }}
        viewport={{ once: true }}
      >
        <Motion.img
          src={robotImage}
          alt="AI Interview Assistant"
          className="w-[250px] md:w-[350px] object-contain"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </Motion.div>
    </div>
  );
};

export default InterviewSchedule;
