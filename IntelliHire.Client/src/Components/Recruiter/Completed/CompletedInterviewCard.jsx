import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarDays,
    faClock,
    faUser,
    faCircleCheck
} from "@fortawesome/free-regular-svg-icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ReportModal from "../../Report/Standard/ReportModal";
import ReportContainer from "../../Report/ReportContainer";

const CompletedInterviewCard = ({ interview }) => {
    const navigate = useNavigate();
    const [selectedReport, setSelectedReport] = useState(null);

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
        <div className="bg-[#F2FAF9] border border-[#C6D3CA] rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#29445D]">
                    {interview.role}
                </h3>

                <span className="text-green-600 flex items-center gap-1 text-sm font-semibold">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    Completed
                </span>
            </div>

            <p className="text-[#45767C] text-sm">
                Candidate: {interview.Candidate}
            </p>

            <hr className="border-[#C6D3CA]" />

            {/* Info */}
            <div className="flex flex-col gap-2 text-[#29445D]">

                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    <span>{formatDate(interview.date)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} />
                    <span>{formatTime(interview.time)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} />
                    <span>{interview.candidateProfile?.name}</span>
                </div>

            </div>

            {/* Button */}
            <div className="flex gap-3 mt-3">

                {/* View Report */}
                {/* <button
                    onClick={() => setSelectedReport({
                        candidate: "NOOR FATIMA",
                        duration: "30 MINS",
                        role: "AI ENGINEER",
                        score: 4,
                        summary: [
                            { domain: "Web Development", score: 4, notes: "All basics clear" }
                        ],
                        strengths: ["Web Development"],
                        weaknesses: ["Web Development"],
                        sections: [
                            {
                                title: "Cloud Computing",
                                score: 4.5,
                                questions: [
                                    {
                                        question: "How would you automate infrastructure provisioning?",
                                        feedback: "Correctly identified Terraform...",
                                        score: 4.5
                                    }
                                ]
                            }
                        ],
                        recommendation: {
                            title: "HIRE THE CANDIDATE",
                            description: "Correctly identified Terraform..."
                        }
                    })} // or fetch by interview.id
                    className="flex-1 bg-[#29445D] text-white py-2 rounded-lg hover:bg-[#1f3447] transition"
                >
                    View Report
                </button> */}

                <button
                    onClick={() =>
                        navigate("/report/detailed", {
                            state: {
                                candidate: "NOOR FATIMA",
                                duration: "30 MINS",
                                role: "AI ENGINEER",
                                score: 4,
                                summary: [
                                    { domain: "Web Development", score: 4, notes: "All basics clear" }
                                ],
                                strengths: ["Web Development"],
                                weaknesses: ["Web Development"],
                                sections: [
                                    {
                                        title: "Cloud Computing",
                                        score: 4.5,
                                        questions: [
                                            {
                                                question: "How would you automate infrastructure provisioning?",
                                                feedback: "Correctly identified Terraform...",
                                                score: 4.5
                                            }
                                        ]
                                    }
                                ],
                                recommendation: {
                                    title: "HIRE THE CANDIDATE",
                                    description: "Correctly identified Terraform..."
                                }
                            }
                        })
                    }
                    className="flex-1 bg-[#29445D] text-white py-2 rounded-lg"
                >
                    View Report
                </button>
                {/* View Details */}
                <button
                    onClick={() => navigate(`/job/${interview.jobDescriptionId}`)}
                    className="flex-1 bg-[#DDE8E2] text-[#29445D] py-2 rounded-lg hover:bg-[#cddbd3] transition"
                >
                    View Details
                </button>
                {selectedReport && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 bg-[#DDE8E2]"
                        onClick={() => setSelectedReport(null)} // close on backdrop click
                        style={{ cursor: "pointer" }}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative"
                            onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setSelectedReport(null)}
                                style={{ cursor: "pointer" }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
                            >
                                ✕
                            </button>

                            <ReportContainer report={selectedReport} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedInterviewCard;