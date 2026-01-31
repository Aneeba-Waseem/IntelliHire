import React from "react";
import { motion as Motion } from "motion/react";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import MeetPreJoin from "./MeetPreJoin";
import { useEffect } from "react";

const MeetingPermissions = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
 
  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden">

      {/* Left Sidebar (10%) */}
      <div className="w-[10%] min-w-[80px] flex items-around justify-center">
        <SidebarCustom />
      </div>

      {/* Right Side (90%) */}
      <Motion.div
        className="w-[90%] min-w-[80px] flex items-around justify-center"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >

        {/* Inner container */}
        <Motion.div
          className="w-full flex items-around justify-center p-5 rounded-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        >
          <MeetPreJoin />
        </Motion.div>
        
      </Motion.div>

    </div>
  );
};

export default MeetingPermissions;
