import DashboardCarousel from "./DashboardCarousel";
import { scheduledInterviews, completedInterviews } from "./data";
import DashboardRobo from "../../assets/user/dashboard_robo.png";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import { motion as Motion } from "framer-motion";

// Staggered container for smooth cascading effect
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      ease: "easeOut",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const Dashboard = () => {
  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden">
      {/* Left Sidebar (10%) */}
      <div className="w-[10%] min-w-[80px] flex items-around justify-center">
        <SidebarCustom />
      </div>

      {/* Right Side (90%) */}
      <div className="w-[90%] min-w-[80px] flex items-around justify-center">
        <div className="w-[90vw] flex flex-col mt-9 md:flex-row md:gap-4 relative">
          {/* Left content */}
          <Motion.div
            className="flex-1 min-w-0 flex flex-col space-y-10 relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* 👇 Heading */}
            <Motion.h1
              className="text-3xl md:text-4xl font-semibold text-[#29445D] text-center"
              variants={itemVariants}
            >
              Hi Ali,{" "}
              <span className="text-[#45767C]">
                Your Interview is Ready to Start
              </span>
            </Motion.h1>

            {/* Carousels */}
            <Motion.div variants={itemVariants}>
              <DashboardCarousel
                title="Scheduled Interviews"
                icon="fa-regular fa-calendar-check"
                data={scheduledInterviews}
              />
            </Motion.div>

            <Motion.div variants={itemVariants}>
              <DashboardCarousel
                title="Completed Interviews"
                icon="fa-solid fa-circle-check"
                data={completedInterviews}
              />
            </Motion.div>
          </Motion.div>

          {/* Right overlapping image */}
          <Motion.img
            src={DashboardRobo}
            alt="Robo"
            className="
              hidden md:block 
              absolute top-0 right-0
              md:w-[35vw] lg:w-[25vw] max-w-[40vw] min-w-[250px]
              object-contain
              z-20
            "
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
