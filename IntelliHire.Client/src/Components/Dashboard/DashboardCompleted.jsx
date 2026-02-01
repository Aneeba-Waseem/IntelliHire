import React from "react";
import ScheduledPieChart from "./ScheduledPieChart";
import DashboardCarousel from "./DashboardCarousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fortawesome/free-regular-svg-icons";
import { scheduledInterviews } from "./Data";
import CompletedPieChart from "./CompletedPieChart";

export default function DashBoardCompleted() {
    const chartData = [
        { name: "Completed", value: 25, label: "25% LOREM" },
        { name: "Pending", value: 12.5, label: "12.5% LOREM" },
        { name: "Cancelled", value: 62.5, label: "62.5% LOREM" },
    ];

    const completedValue = 50; // percentage filled
    const completedCount = 10;

    return (
        <div className="bg-[#DDE8E2] flex flex-col md:flex-row items-start justify-between rounded-2xl px-8 py-10 w-full shadow-sm gap-8">
            {/* Left Section (Chart) */}
            <div className="w-full md:w-[40%] flex flex-col justify-center items-center">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 self-start">
                    <FontAwesomeIcon
                        icon={faCalendarCheck}
                        className="text-[#29445D]"
                        size="lg"
                    />
                    <h2
                        className="text-2xl text-[#29445D] tracking-wide"
                        style={{ fontFamily: "Staatliches, monospace" }}
                    >
                        COMPLETED INTERVIEWS
                    </h2>
                </div>

                {/* Chart + Labels */}
                <div className="flex flex-row rounded-2xl bg-[#F8F8F8] p-8 items-center justify-between w-full">
                    {/* Chart */}
                    <div className="relative flex flex-col justify-center items-center w-[50%]">
                        <CompletedPieChart
                            title="Completed"
                            value={completedValue}
                            count={completedCount}
                            chartSize={300}
                        />

                    </div>

                    {/* Percentage Labels */}
                    <div className="flex flex-col gap-4 w-[45%] text-left text-sm text-[#29445D] leading-snug">
                        <div>
                            <span className="text-[#E44D3A] font-bold block mb-1">
                                25% LOREM
                            </span>
                            <p className="text-xs opacity-70">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            </p>
                        </div>
                        <div>
                            <span className="text-[#F4C542] font-bold block mb-1">
                                12.5% LOREM
                            </span>
                            <p className="text-xs opacity-70">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            </p>
                        </div>
                        <div>
                            <span className="text-[#5A8F7B] font-bold block mb-1">
                                62.5% LOREM
                            </span>
                            <p className="text-xs opacity-70">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-[2px] bg-[#9CBFAC] rounded-full  mx-4 self-stretch" />

            {/* Right Section (Carousel) */}
            <div className="w-full md:w-[60%] py-5 flex flex-col justify-between rounded-2xl">
                <DashboardCarousel
                    title="Scheduled Interviews"
                    icon="fa-regular fa-calendar-check"
                    data={scheduledInterviews}
                />

                {/* View All */}
                <div className="flex justify-end mt-4">
                    <button className="text-[#29445D] text-lg hover:underline">
                        VIEW ALL &gt;&gt;
                    </button>
                </div>
            </div>
        </div>
    );
}
