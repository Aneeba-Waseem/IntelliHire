import React from "react";
import { motion } from "framer-motion";
import landing_robot from "../../assets/landing/landing_robot.png";
import { Icon } from '@iconify/react';

import CardStack from "./CardStack";
import Stats from "./Stats";
import LandingSection from "./LandingSection";

export default function HeroSection() {
  return (
    <div className="w-full overflow-hidden">
      {/* Top Hero Section */}
      <div className="flex flex-col-reverse lg:flex-row min-h-[90vh] bg-[#D1DED3] px-6 lg:px-10 py-10 lg:py-0">
        
        {/* Left Side - Text */}
        <motion.div
          className="w-full lg:w-[48%] xl:w-[40%] flex flex-col mt-10 justify-center items-start"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-3xl md:text-5xl font-bold text-[#29445D] mb-6"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            IntelliHire, The AI That Interviews Evaluates and Delivers Insight
          </motion.h1>

          <motion.p
            className="text-[#45767C] text-lg mb-6"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            IntelliHire is revolutionizing the hiring process by acting as your personal AI interview assistant.
            It conducts interviews seamlessly, evaluates candidates objectively, and generates detailed reports that help
            you make smarter hiring decisions.
          </motion.p>

          {/* Stats */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <Stats />
          </motion.div>
        </motion.div>

        {/* Right Side - Image + CardStack */}
        <motion.div
          className="w-full xl:mr-5 lg:w-[48%] xl:w-[60%] flex justify-center lg:justify-between items-center relative mt-10 lg:mt-0"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* Hero Image */}
          <motion.img
            src={landing_robot}
            alt="Hero"
            className="w-[90%] md:w-[70%] lg:w-[90%] xl:w-[65%] h-auto rounded-lg mx-auto lg:mx-0"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* CardStack overlapping hero image - hidden on md and smaller */}
          <motion.div
            className="hidden lg:block absolute xl:w-[35%] lg:w-[20%] p-3 flex justify-center items-center -translate-y-16 right-0"
            initial={{ opacity: 0, x: 50, y: 50 }}
            whileInView={{ opacity: 1, x: 0, y: -16 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <CardStack />
          </motion.div>

          {/* Read More button */}
          <motion.button
            className="hidden lg:flex mt-100 mr-10 items-center justify-center xl:space-x-2 lg:space-x-0 border-2 border-[#29445D] text-[#29445D] font-bold px-6 py-3 rounded-3xl hover:bg-[#29445D] hover:text-white transition-colors"
            animate={{ y: [0, 4, 0] }} // bounce effect
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            onClick={() => {
              const section = document.getElementById("bottom-section");
              if (section) section.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span>Read More</span>
            <Icon icon="mdi:chevron-double-down" className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div id="bottom-section" className="flex flex-col items-center bg-[#F2FAF5] py-10 px-6 lg:px-20">
        <div className="w-full text-center mb-10">
          <h2 className="text-4xl lg:text-5xl mt-10 font-bold text-[#29445D]">
            Why Choose IntelliHire?
          </h2>
          <p className="text-[#45767C] mt-4 text-xl lg:text-2xl max-w-3xl mx-auto">
            Discover how IntelliHire helps recruiters hire smarter and empowers candidates to grow their careers.
          </p>
        </div>

        <LandingSection />
      </div>
    </div>
  );
}
