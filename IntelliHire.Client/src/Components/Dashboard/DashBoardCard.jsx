import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck, faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import ScheduledPieChart from "./ScheduledPieChart";
import CompletedPieChart from "./CompletedPieChart";

export default function DashBoardCard({ title, value, chartData, count ,chartSize }) {
    const isScheduled = title === "Scheduled";

    return (
        <div className="bg-[#DDE8E2] flex items-center justify-between rounded-lg px-6 py-12 w-[65%] shadow-sm">
            {/* Left Icon */}
            <div className="flex items-center justify-center w-[60px]">
                <FontAwesomeIcon
                    icon={isScheduled ? faCalendarCheck : faCircleCheck}
                    className="text-[#29445D]"
                    size="3x"
                />
            </div>

            {/* Center Text */}
            <div
                className="flex flex-col items-center justify-center text-center flex-1"
                style={{ fontFamily: "Staatliches, monospace" }}
            >
                <span className="text-6xl text-[#29445D]">
                    {isScheduled ? value : count}
                </span>
                <span className="text-2xl tracking-wider text-[#29445D] uppercase">
                    {isScheduled ? "Scheduled" : "Completed"}
                </span>
            </div>

            {/* Right Chart */}
            <div className="flex justify-center items-center w-[100px]">
                {isScheduled ? (
                    <ScheduledPieChart chartData={chartData} size={chartSize} />
                ) : (
                    <CompletedPieChart value={value} count={count} size={chartSize} />
                )}

            </div>
        </div>
    );
}
