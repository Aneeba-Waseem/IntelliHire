import React from "react";

import { loadAuthState } from "../../features/auth/persistAuth";
import { motion } from "framer-motion";

const GoodByePage = () => {
  const authState = loadAuthState();
  const name = authState?.user?.fullName || "Candidate";

  return (
    <div className="bg-[#D1DED3] min-h-screen flex">
      
      {/* Sidebar */}
      {/* <SidebarCustom /> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* <TopBar /> */}

        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-[#F2FAF5] shadow-2xl rounded-3xl p-10 max-w-2xl text-center"
          >
            {/* Icon */}
            {/* <div className="text-5xl mb-4">🎉</div> */}

            {/* Heading */}
            <h1 className="text-3xl font-bold text-[#29445D] mb-4">
              Thank You, {name}!
            </h1>

            {/* Message */}
            <p className="text-[#45767C] text-lg leading-relaxed mb-6">
              We truly appreciate the time and effort you put into your interview.
              It was a pleasure learning more about your skills and experience.
            </p>

            <p className="text-[#45767C] text-md leading-relaxed mb-6">
              Our HR team is currently reviewing your interview and feedback.
              You will receive an update regarding your application status soon.
            </p>

            <p className="text-[#45767C] text-md leading-relaxed">
              Thank you once again for your interest in joining our team.
              We wish you the very best in your career journey! 
            </p>

            {/* Divider */}
            {/* <div className="mt-8 border-t border-[#E0E0E0] pt-4 text-sm text-gray-500">
              Need help? Contact our support team anytime.
            </div> */}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GoodByePage;