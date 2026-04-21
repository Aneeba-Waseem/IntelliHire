import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function DetailedReportPage() {
  const navigate = useNavigate();
  const { state: report } = useLocation();
  const pageRef = useRef();
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (!report) {
    return (
      <div className="p-6 text-gray-600">
        No report found.
      </div>
    );
  }

const handleDownload = async (includeDetails) => {
  const res = await fetch("http://localhost:8000/generate-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ report, includeDetails }),
  });

  const blob = await res.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.candidate || "report"}.pdf`;
  a.click();

  window.URL.revokeObjectURL(url);
};

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
    <div ref={pageRef} className="min-h-screen bg-[#D1DED3] p-6 px-10" style={{ fontFamily: "Staatliches, monospace" }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() => navigate(-1)}
          className="text-lg text-[#45767C] underline"
        >
          ← Back
        </button>

        <h1 className="text-4xl "> Interview REPORT</h1>

        <button
  onClick={() => setShowModal(true)}
  className="bg-[#45767C] text-white px-4 py-2 rounded-xl text-xl"
  style={{ fontFamily: "Barlow Condensed, monospace" }}
>
  Download
</button>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-xl">
        <div>
          <p style={{ fontFamily: "Barlow Condensed, monospace" }}><span style={{ fontFamily: "Staatliches, monospace" }} className="text-2xl">Candidate:</span> {candidate}</p>
          <p style={{ fontFamily: "Barlow Condensed, monospace" }}><span style={{ fontFamily: "Staatliches, monospace" }} className="text-2xl">Duration:</span> {duration}</p>
        </div>

        <div className="text-right">
          <p style={{ fontFamily: "Barlow Condensed, monospace" }}><span style={{ fontFamily: "Staatliches, monospace" }} className="text-2xl">Role:</span> {role}</p>
          <p style={{ fontFamily: "Barlow Condensed, monospace" }}><span style={{ fontFamily: "Staatliches, monospace" }} className="text-2xl">Score:</span> {score}/5</p>
        </div>
      </div>

      {/* Score Summary */}
      <div className="mb-6">
        <h2 className=" text-2xl mb-2">SCORE SUMMARY</h2>

        <div className="bg-[#cbd9d0] rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 text-xl border-b p-3">
            <div>DOMAIN</div>
            <div>SCORE</div>
            <div>NOTES</div>
          </div>

          {summary.length ? summary.map((item, i) => (
            <div key={i} className="grid grid-cols-3 p-3 border-t text-xl" style={{ fontFamily: "Barlow Condensed, monospace" }}>
              <div>{item.domain}</div>
              <div>{item.score}</div>
              <div>{item.notes}</div>
            </div>
          )) : (
            <p className="p-3 text-sm text-gray-500">
              No summary available
            </p>
          )}
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-2xl">
        <div>
          <h3 className=" mb-2">STRENGTHS</h3>
          <ul className="list-disc ml-5 text-xl" style={{ fontFamily: "Barlow Condensed, monospace" }}>
            {strengths.length ? strengths.map((s, i) => <li key={i}>{s}</li>) : (
              <li className="text-gray-500">No strengths listed</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className=" mb-2 ">WEAKNESSES</h3>
          <ul className="list-disc ml-5 text-xl" style={{ fontFamily: "Barlow Condensed, monospace" }}>
            {weaknesses.length ? weaknesses.map((w, i) => <li key={i}>{w}</li>) : (
              <li className="text-gray-500">No weaknesses listed</li>
            )}
          </ul>
        </div>
      </div>

      {/* Details */}
      <div>
        <div className="flex gap-2 items-center mb-4">
          <h2 className="text-2xl">DETAILS</h2>

          <button
            onClick={() => setShowDetails(prev => !prev)}
            className="text-lg text-[#45767C] "
            style={{ fontFamily: "Barlow Condensed, monospace" }}
          >
            {showDetails ? "▲" : "▼"}
          </button>
        </div>

        {showDetails && (
          <>
            {sections.length ? sections.map((section, idx) => (
              <div key={idx} className="mb-6 text-2xl">
                <div className="flex justify-between">
                  <h3>{section.title?.toUpperCase()}</h3>
                  <span>{section.score} / 5</span>
                </div>

                {section.questions?.map((q, i) => (
                  <div key={i} className="mt-3 text-xl" style={{ fontFamily: "Barlow Condensed, monospace" }}>
                    <p><strong>Q{i + 1}:</strong> {q.question}</p>
                    <p><strong>Feedback:</strong> {q.feedback}</p>
                    <p><strong>Score:</strong> {q.score}</p>
                  </div>
                ))}
              </div>
            )) : (
              <p className="text-md text-gray-500">
                No detailed sections available
              </p>
            )}
          </>
        )}
      </div>

      {/* Recommendation */}
      <div className="mt-6">
        <h2 className=" text-2xl">RECOMMENDATION</h2>
        <p className=" mt-1 text-xl" style={{ fontFamily: "Barlow Condensed, monospace" }}>
          {recommendation?.title || "N/A"}
        </p>
        <p className="text-lg mt-2" style={{ fontFamily: "Barlow Condensed, monospace" }}>
          {recommendation?.description || "No recommendation provided"}
        </p>
      </div>
{showModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div
      className="bg-[#D1DED3] p-8 rounded-2xl w-[400px] text-center shadow-xl"
      style={{ fontFamily: "Staatliches, monospace" }}
    >
      <h2 className="text-2xl mb-4">Download Report</h2>

      <p
        className="text-lg mb-6"
        style={{ fontFamily: "Barlow Condensed, monospace" }}
      >
        Choose report type
      </p>

      <div className="flex flex-col gap-4">

        <button
          onClick={() => {
            setShowModal(false);
            handleDownload(false); // summary only
          }}
          className="bg-[#45767C] text-white py-2 rounded-lg text-xl"
          style={{ fontFamily: "Barlow Condensed, monospace" }}
        >
          Summary Report
        </button>

        <button
          onClick={() => {
            setShowModal(false);
            handleDownload(true); // include details
          }}
          className=" border-2 border-[#45767C] text-[#45767C] py-2 rounded-lg text-xl"
          style={{ fontFamily: "Barlow Condensed, monospace" }}
        >
          Detailed Report
        </button>

        <button
          onClick={() => setShowModal(false)}
          className="text-sm text-gray-600 mt-2 underline"
        >
          Cancel
        </button>

      </div>
    </div>
  </div>
)}
    </div>
    
  );
}