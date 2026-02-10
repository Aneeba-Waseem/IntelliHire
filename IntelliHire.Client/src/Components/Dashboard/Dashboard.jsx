import DashboardCarousel from "./DashboardCarousel";
// import { scheduledInterviews, completedInterviews } from "./data";
import DashboardRobo from "../../assets/user/dashboard_robo.png";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import { motion as Motion } from "framer-motion";
import DashBoardCard from "./DashBoardCard";
import DashBoardScheduled from "./DashboardScheduled";
import DashBoardCompleted from "./DashboardCompleted";
import { useSelector } from "react-redux";

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
  const scheduled = [
    { name: "Completed", value: 10 },
    { name: "Pending", value: 10 },
    { name: "Cancelled", value: 10 },
  ];

  const completedValue = 50; // percentage filled
  const completedCount = 10;
  const user = useSelector (state => state.auth.user);


  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row ">
      {/* Left Sidebar */}
      <div className="w-[10%] flex justify-center md:justify-start mb-0">
        <SidebarCustom />
      </div>


      {/* Right Section */}
      <div
        className="flex-1 w-[100%] sm:w-[90%] flex flex-col p-4 md:p-6 pb-20 sm:pb-0"
        style={{ fontFamily: "Staatliches, monospace" }}
      >
        {/* Greeting */}
        <Motion.h1
          className="text-2xl md:text-4xl text-[#29445D] flex items-center justify-center text-center md:text-left mb-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          Hi {user?.fullName || "User"},{" "}
          <span className="text-[#45767C]">How are you doing</span>
        </Motion.h1>

        {/* Cards Row */}
        <div className="flex flex-col lg:flex-row mt-10 mb-15 justify-center items-center gap-6 h-auto lg:h-[200px] w-full">
          <DashBoardCard
            title="Scheduled"
            value={20}
            chartData={scheduled}
            chartSize={160}
          />

          <DashBoardCard
            title="Completed"
            value={completedValue}
            count={completedCount}
            chartSize={160}
          />
        </div>


        {/* Remaining Dashboard Sections */}
        <div className="flex flex-col gap-7 w-full">
          <DashBoardScheduled />
          <DashBoardCompleted />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
