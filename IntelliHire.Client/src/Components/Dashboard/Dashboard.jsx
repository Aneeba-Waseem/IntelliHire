import DashboardCarousel from "./DashboardCarousel";
import {
    scheduledInterviews,
    completedInterviews,
} from "./data";
import DashboardRobo from "../../assets/user/dashboard_robo.png";
import SidebarCustom from "../CommonComponents/SidebarCustom";

const Dashboard = () => {
    return (
        <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden ">

            {/* Left Sidebar (10%) */}
            <div className="w-[10%] min-w-[80px] flex items-around justify-center">
                <SidebarCustom />
            </div>

            {/* Right Side (90%) split into two equal parts) */}
            <div className="w-[90%] min-w-[80px] flex items-around justify-center">

                {/* left one  */}
                <div className="w-[90vw] flex flex-col mt-9 md:flex-row md:gap-4 relative">
                    {/* Left content */} 
                    <div className="flex-1 min-w-0 flex flex-col space-y-10 relative z-10">
                        <DashboardCarousel
                            title="Scheduled Interviews"
                            icon="fa-regular fa-calendar-check"
                            data={scheduledInterviews}
                        />

                        <DashboardCarousel
                            title="Completed Interviews"
                            icon="fa-solid fa-circle-check"
                            data={completedInterviews}
                        />
                    </div>

                    {/* Right overlapping image */}
                    <img
                        src={DashboardRobo}
                        alt="Robo"
                        className="
                        hidden md:block 
                        absolute top-0 right-0
                        md:w-[35vw] lg:w-[25vw] max-w-[40vw] min-w-[250px]
                        object-contain
                        z-20
                        "
                    />
                </div>

                {/* Right one
        <div className="w-[50%]  bg-black flex items-around justify-center">
        </div> */}


            </div>

        </div>
    );
};

export default Dashboard;
