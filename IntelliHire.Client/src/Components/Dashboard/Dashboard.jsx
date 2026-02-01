import DashboardCarousel from "./DashboardCarousel";
// import { scheduledInterviews, completedInterviews } from "./ata";
import DashboardRobo from "../../assets/user/dashboard_robo.png";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import { motion as Motion } from "framer-motion";
import DashBoardCard from "./DashBoardCard";
import DashBoardScheduled from "./DashboardScheduled";
import DashBoardCompleted from "./DashboardCompleted";

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
  const sheduled = [
    { name: "Completed", value: 10 },
    { name: "Pending", value: 10 },
    { name: "Cancelled", value: 10 },

  ];

  const completedValue = 50; // percentage filled
  const completedCount = 10;
  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden">
      {/* Left Sidebar (10%) */}
      <div className="w-[10%] min-w-[80px] flex items-around justify-center">
        <SidebarCustom />
      </div>

      {/* Right Side (90%) */}
      <div className="flex-1 flex flex-col p-6"
        style={{ fontFamily: "Staatliches, monospace" }}
      >
        <Motion.h1
          className="text-3xl md:text-4xl text-[#29445D] text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          Hi Fatima, <span className="text-[#45767C]">How are you doing</span>
        </Motion.h1>
        {/* Cards Row at Top */}
        <div className="flex flex-row mt-10 mb-15 justify-center items-center gap-6 h-[200px] w-full">
          <DashBoardCard
            title="Scheduled"
            value={20}
            chartData={sheduled}
            chartSize={160}
          />

          <DashBoardCard
            title="Completed"
            value={completedValue}
            count={completedCount}
            chartSize={160}
          />

        </div>

        {/* Rest of right section content below */}
        <div className="flex flex-col gap-7">
          <DashBoardScheduled />
          <DashBoardCompleted/>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
