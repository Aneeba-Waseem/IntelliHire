import React from "react";
import { useModal } from "../JobForm/ModalContext";
import ReportModal from "./ReportModal";

export default function InterviewDetails() {
  const { openModal } = useModal();

  const reportData = {
    candidate: "Ali Khan",
    role: "Backend Engineer",
    duration: "32 min",
    overallScore: 3.8,
    domainScores: {
      understanding: 4,
      correctness: 3,
      relevance: 4,
    },
    strengths: ["Good API knowledge", "Clear communication"],
    concerns: ["Weak in optimization"],
    recommendation: "Hire with minor training",
  };

  return (
    <button
      onClick={() =>
        openModal(<ReportModal report={reportData} />)
      }
      className="bg-[#45767C] text-white px-4 py-2 rounded-lg"
    >
      View Report
    </button>
  );
}