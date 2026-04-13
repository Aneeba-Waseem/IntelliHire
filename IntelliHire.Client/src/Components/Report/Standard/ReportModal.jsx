import React from "react";
import ScoreBar from "./ScoreBar";
import DomainChart from "./DomainChart";
import SummarySection from "./SummarySection";
import { useNavigate } from "react-router-dom";

export default function ReportModal({ report }) {
  if (!report) return null;

    const navigate = useNavigate();
  const {
    candidate,
    role,
    duration,
    overallScore,
    domainScores,
    strengths,
    concerns,
    recommendation,
  } = report;

  return (
    <div className="text-[#29445D] space-y-6 bg-[#DDE8E2]">
      {/* Header */}
      <h2 className="text-2xl font-bold text-center tracking-wide">
        JOB INTERVIEW REPORT
      </h2>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <p><strong>Candidate:</strong> {candidate}</p>
        <p><strong>Role:</strong> {role}</p>
        <p><strong>Duration:</strong> {duration}</p>
        <p><strong>Overall Score:</strong> {overallScore}/5</p>
      </div>

      {/* Overall Score Bar */}
      <div>
        <h3 className="font-semibold mb-2">Overall Performance</h3>
        <ScoreBar value={overallScore} max={5} />
      </div>

      {/* Domain Section */}
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <DomainChart data={domainScores} />

        <div className="space-y-2">
          {Object.entries(domainScores).map(([domain, score]) => (
            <ScoreBar
              key={domain}
              label={domain}
              value={score}
              max={5}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <SummarySection
        strengths={strengths}
        concerns={concerns}
        recommendation={recommendation}
      />

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
  <button
    className="
      bg-[#45767C] text-white
      px-4 py-2
      rounded-xl
      text-sm sm:text-base
      whitespace-nowrap
      hover:scale-105 transition
    "
  >
    Download Report
  </button>

  <button
    className="
      border border-[#45767C]
      px-4 py-2
      rounded-xl
      text-sm sm:text-base
      whitespace-nowrap
      hover:bg-[#45767C] hover:text-white
      transition
    "
    onClick={() => navigate('/report')}
  >
    View Detailed Report
  </button>
</div>
    </div>
  );
}