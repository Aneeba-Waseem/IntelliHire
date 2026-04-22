import React, { useEffect } from "react";
import { motion as Motion } from "motion/react";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import MeetPreJoin from "./MeetPreJoin";

const MeetingPermissions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-col md:flex-row overflow-x-hidden">

      {/* Sidebar */}
      <div className="w-full md:w-[10%] min-w-[80px] flex justify-center items-start md:items-center py-3 md:py-0">
        {/* <SidebarCustom /> */}
      </div>

      {/* Right Side */}
      <Motion.div
        className="w-full md:w-[90%] min-h-[70vh] flex justify-center items-center px-4 sm:px-6 md:px-0"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >

        {/* Inner container */}
        <Motion.div
          className="w-full max-w-5xl min-h-[60vh] flex justify-center items-center p-3 sm:p-5 md:p-6 rounded-lg"
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