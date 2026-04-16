import React from "react";
import ScoreBar from "./ScoreBar";
import DomainChart from "./DomainChart";
import SummarySection from "./SummarySection";

export default function ReportModal({
  report,
  onViewDetailed,
  onDownload,
}) {
  if (!report) return null;

  const {
    candidate = "N/A",
    role = "N/A",
    duration = "N/A",
    overallScore = 0,
    domainScores = {},
    strengths = [],
    concerns = [],
    recommendation = {},
  } = report;

  return (
    <div className="text-[#29445D] space-y-6">
      <h2 className="text-2xl font-bold text-center">
        JOB INTERVIEW REPORT
      </h2>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <p><strong>Candidate:</strong> {candidate}</p>
        <p><strong>Role:</strong> {role}</p>
        <p><strong>Duration:</strong> {duration}</p>
        <p><strong>Overall Score:</strong> {overallScore}/5</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Overall Performance</h3>
        <ScoreBar value={overallScore} max={5} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        {Object.keys(domainScores).length > 0 ? (
          <DomainChart data={domainScores} />
        ) : (
          <p className="text-sm text-gray-500">No domain data</p>
        )}

        <div className="space-y-2">
          {Object.entries(domainScores).map(([domain, score]) => (
            <ScoreBar key={domain} label={domain} value={score} max={5} />
          ))}
        </div>
      </div>

      <SummarySection
        strengths={strengths}
        concerns={concerns}
        recommendation={recommendation}
      />

      <div className="flex gap-3 justify-center mt-4">
        <button
          onClick={onDownload}
          className="bg-[#45767C] text-white px-4 py-2 rounded-xl hover:scale-105 transition"
        >
          Download Report
        </button>

        <button
          onClick={onViewDetailed}
          className="border border-[#45767C] px-4 py-2 rounded-xl hover:bg-[#45767C] hover:text-white transition"
        >
          View Detailed Report
        </button>
      </div>
    </div>
  );
}