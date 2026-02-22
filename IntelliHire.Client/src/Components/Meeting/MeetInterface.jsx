import React, { useState } from "react";
import { motion as Motion } from "motion/react";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import InterviewSchedule from "./InterviewSchedule";
import InterviewRules from "./InterviewRules";
import { useNavigate } from "react-router-dom";

const MeetInterface = () => {
  const [rulesChecked, setRulesChecked] = useState(false);
  const navigate = useNavigate();

  const handleClick = (e) => {
        navigate('/meetingPermissions')
    };

  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden">

      {/* Left Sidebar (10%) */}
      <div className="w-[10%] min-w-[80px] flex items-around justify-center">
        <SidebarCustom />
      </div>

      {/* Right Side (90%) */}
      <div className="w-[90%] min-w-[80px] flex flex-col items-around justify-center">

        {/* Top Section */}
        <div className="w-full h-[40%] flex flex-col items-around justify-center">
          <Motion.h1
            className="text-3xl md:text-4xl font-semibold text-[#29445D] text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Hi Ali, <span className="text-[#45767C]">Your Interview is Ready to Start</span>
          </Motion.h1>

          <div className="mt-10">
            <InterviewSchedule />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="w-full flex flex-col items-start mt-7 justify-center px-5">
          <InterviewRules />

          {/* Checkbox Confirmation */}
          <div className="flex items-center gap-3 mt-6">
            <input
              type="checkbox"
              id="rulesCheck"
              checked={rulesChecked}
              onChange={() => setRulesChecked(!rulesChecked)}
              className="w-5 h-5 accent-[#45767C]"
            />
            <label htmlFor="rulesCheck" className="text-[#29445D] font-medium">
              I have read and understood the interview rules
            </label>
          </div>

          {/* Join Meeting Button */}
          <div className="mt-5 ml-auto mb-7 mr-8">
            <Motion.button
              whileHover={{
                scale: rulesChecked ? 1.03 : 1,
                boxShadow: rulesChecked ? "0px 8px 20px rgba(0,0,0,0.15)" : "none",
              }}
              whileTap={{ scale: rulesChecked ? 0.97 : 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              disabled={!rulesChecked}
              className={`rounded-3xl w-[180px] py-5 font-semibold
                text-[#F2FAF5]
                bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
                hover:from-[#45767C] hover:via-[#719D99] hover:to-[#9CBFAC]
                ${!rulesChecked ? "opacity-50 cursor-not-allowed" : "opacity-100 cursor-pointer"}`}

                onClick={handleClick}
            >
              Next
            </Motion.button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MeetInterface;
