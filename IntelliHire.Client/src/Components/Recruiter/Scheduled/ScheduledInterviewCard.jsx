import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faClock,
    faUser,
    faHourglassHalf
} from "@fortawesome/free-regular-svg-icons";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ScheduledInterviewCard = ({ interview, onViewProfile }) => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const interviewDateTime = new Date(`${interview.date}T${interview.time}`);
            const diff = interviewDateTime - now;

            if (diff <= 0) {
                setTimeLeft("Started");
                return;
            }

            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours % 24}h left`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes % 60}m left`);
            } else {
                setTimeLeft(`${minutes}m left`);
            }
        };

        // ✅ run immediately (IMPORTANT)
        calculateTimeLeft();

        // ✅ update every minute
        const interval = setInterval(calculateTimeLeft, 60000);

        return () => clearInterval(interval);
    }, [interview.date, interview.time]);
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(":");
        const date = new Date();
        date.setHours(h, m);

        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div className="bg-[#F2FAF5] border border-[#C6D3CA] rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4">

            {/* Role + Candidate */}
            <div>
                <h3 className="text-xl font-semibold text-[#29445D]">
                    {interview.role}
                </h3>
                <p className="text-[#45767C] text-sm">
                    Candidate: {interview.Candidate}
                </p>
            </div>

            <hr className="border-[#C6D3CA]" />

            {/* Date & Time */}
            <div className="flex flex-col gap-2 text-[#29445D]">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    <span>{formatDate(interview.date)}</span>        </div>

                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} />
                    <span>{formatTime(interview.time)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} />
                    <span>{interview.Candidate}</span>
                </div>

                <div className="flex items-center gap-2 text-[#45767C] font-semibold">
                    <FontAwesomeIcon icon={faHourglassHalf} />
                    <span >
                        {timeLeft}
                    </span>
                </div>

            </div>


            {/* Buttons */}
            <div className="flex gap-3 mt-3">

                {/* View Profile (Modal trigger) */}
                <button
                onClick={() => navigate(`/resume/${interview.resumeId}`)}
                style={{cursor: "pointer"}}
                    className="flex-1 bg-[#DDE8E2] text-[#29445D] py-2 rounded-lg hover:bg-[#cddbd3] transition"
                >
                    View Profile
                </button>

                {/* View Details (Route) */}
                <button
                    onClick={() => navigate(`/job/${interview.jobDescriptionId}`)}
                    style={{cursor: "pointer"}}
                    className="flex-1 bg-[#29445D] text-white py-2 rounded-lg hover:bg-[#1f3447] transition"
                >
                    View Details
                </button>

            </div>
        </div>
    );
};

export default ScheduledInterviewCard;