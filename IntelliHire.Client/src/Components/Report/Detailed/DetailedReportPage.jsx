import React from "react";

export default function DetailedReportModal({ report, onBack, onDownload }) {
  if (!report) return null;

  const {
    candidate = "N/A",
    duration = "N/A",
    role = "N/A",
    score = 0,
    summary = [],
    strengths = [],
    weaknesses = [],
    sections = [],
    recommendation = {},
  } = report;

  return (
    <>
      {/* 🔙 Back Button */}
      <button
        onClick={onBack}
        className="mb-4 text-sm text-[#45767C] underline"
      >
        ← Back to Summary
      </button>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-wide text-gray-700">
          DETAILED REPORT
        </h1>
        <button
  onClick={onDownload}
  className="
    bg-[#45767C] text-white
    px-4 py-2
    rounded-xl
    text-sm sm:text-base
    hover:scale-105 transition
  "
>
  Download Report
</button>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
        <div>
          <p><strong>Candidate:</strong> {candidate}</p>
          <p><strong>Duration:</strong> {duration}</p>
        </div>
        <div className="text-right">
          <p><strong>Role:</strong> {role}</p>
          <p><strong>Candidate Score:</strong> {score} / 5</p>
        </div>
      </div>

      {/* Score Summary */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">SCORE SUMMARY:</h2>
        <p className="text-sm text-gray-600 mb-2 text-right">
          (Overall Score scale: 1-5 (1=Below bar, 3=Meets bar, 5=Exceptional))
        </p>

        <div className="bg-[#dfe7e5] rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 font-semibold border-b p-3">
            <div>DOMAIN</div>
            <div>SCORE</div>
            <div>NOTES</div>
          </div>

          {summary.length > 0 ? (
            summary.map((item, idx) => (
              <div key={idx} className="grid grid-cols-3 p-3 border-t text-sm">
                <div>{item.domain}</div>
                <div>{item.score}</div>
                <div>{item.notes}</div>
              </div>
            ))
          ) : (
            <p className="p-3 text-sm text-gray-500">
              No summary available
            </p>
          )}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-bold mb-2">STRENGTHS:</h3>
          <ul className="list-disc ml-5">
            {strengths.length > 0 ? (
              strengths.map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li className="text-gray-500">No strengths listed</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-2">WEAKNESSES:</h3>
          <ul className="list-disc ml-5">
            {weaknesses.length > 0 ? (
              weaknesses.map((w, i) => <li key={i}>{w}</li>)
            ) : (
              <li className="text-gray-500">No weaknesses listed</li>
            )}
          </ul>
        </div>
      </div>

      {/* Details */}
      <div>
        <h2 className="font-bold text-lg mb-4">DETAILS:</h2>

        {sections.length > 0 ? (
          sections.map((section, idx) => (
            <div key={idx} className="mb-6">
              <div className="flex justify-between font-bold">
                <h3>{section.title?.toUpperCase()}</h3>
                <span>{section.score} / 5</span>
              </div>

              {section.questions?.map((q, i) => (
                <div key={i} className="mt-3 text-sm">
                  <p>
                    <strong>Q{i + 1}:</strong> {q.question}
                  </p>
                  <p>
                    <strong>Feedback:</strong> {q.feedback}
                  </p>
                  <p>
                    <strong>Score:</strong> {q.score} / 5
                  </p>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No detailed sections available</p>
        )}
      </div>

      {/* Recommendation */}
      <div className="mt-6">
        <h2 className="font-bold text-lg">RECOMMENDATION:</h2>
        <p className="font-bold mt-1">{recommendation?.title || "N/A"}</p>
        <p className="text-sm mt-2">
          {recommendation?.description || "No recommendation provided"}
        </p>
      </div>
    </>
  );
}