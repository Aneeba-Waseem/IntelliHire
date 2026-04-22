import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getEvaluation } from "../../../api/getEvaluation";

export default function DetailedReportPage() {
  const { candidateId, jobId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getEvaluation(candidateId, jobId);
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidateId, jobId]);

  if (loading) return <div className="p-6 text-[#29445D]">Loading...</div>;

  if (!report) {
    return <div className="p-6 text-[#29445D]">No report found.</div>;
  }

  const handleDownload = async (includeDetails) => {
    const res = await fetch("http://localhost:8000/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    role = "N/A",
    score = 0,
    summary = [],
    strengths = [],
    weaknesses = [],
    sections = [],
    recommendation = {},
  } = report;

  return (
    <motion.div
      className="min-h-screen bg-[#D1DED3] text-[#29445D] px-6 md:px-12 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <button
          onClick={() => navigate(-1)}
          className="text-[#29445D] opacity-70 hover:opacity-100 transition text-sm"
        >
          ← back
        </button>

        <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
          Interview Report
        </h1>

        <button
        style={{cursor:"pointer"}}
          onClick={() => setShowModal(true)}
          className="border-2 border-[#29445D] text-[#29445D] rounded-full px-8 py-2 font-semibold hover:bg-[#29445D] hover:text-[#D1DED3] transition"
        >
          download
        </button>
      </div>

      {/* Candidate Card */}
      <div className="bg-[#F2FAF5]/30 backdrop-blur-xl border border-white/40 rounded-2xl p-6 mb-10 shadow-sm">
        <div className="flex justify-between flex-col md:flex-row gap-2">
          <p className="text-lg">
            <span className="opacity-70">Candidate:</span> {candidate}
          </p>

          <p className="text-lg md:text-right">
            <span className="opacity-70">Role:</span> {role} |{" "}
            <span className="opacity-70">Score:</span> {score}/5
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-10">
        <h2 className="text-xl text-[#29445D] font-medium mb-4">Score Summary</h2>

        <div className="rounded-2xl overflow-hidden bg-[#F2FAF5]/30 backdrop-blur-xl border border-white/40">
          <div className="grid text-[#29445D] grid-cols-3 p-4 text-lg font-bold ">
            <div>Domain</div>
            <div className="text-center">Score</div>
            <div>Notes</div>
          </div>

          {summary.length ? summary.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-3 p-4 border-t border-white/30 text-sm"
            >
              <div>{item.domain}</div>
              <div className="text-center">{item.score}</div>
              <div className="text-[#29445D font-semibold]">{item.notes || "-"}</div>
            </div>
          )) : (
            <p className="p-4 text-sm opacity-60">No summary available</p>
          )}
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">

        <div className="bg-[#F2FAF5]/30 backdrop-blur-xl border border-white/40 rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-3">Strengths</h3>
          <ul className="space-y-2 text-sm">
            {strengths.length ? strengths.map((s, i) => (
              <li key={i} className="opacity-80">• {s}</li>
            )) : <li className="opacity-50">No strengths listed</li>}
          </ul>
        </div>

        <div className="bg-[#F2FAF5]/30 backdrop-blur-xl border border-white/40 rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-3">Areas to Improve</h3>
          <ul className="space-y-2 text-sm">
            {weaknesses.length ? weaknesses.map((w, i) => (
              <li key={i} className="opacity-80">• {w}</li>
            )) : <li className="opacity-50">No weaknesses listed</li>}
          </ul>
        </div>

      </div>

      {/* Details */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-medium">Details</h2>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-[#29445D] opacity-70 hover:opacity-100"
          >
            {showDetails ? "hide" : "show"}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-5">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-[#F2FAF5]/30 backdrop-blur-xl border border-white/40 rounded-2xl p-6"
              >
                <div className="flex justify-between mb-3">
                  <h3 className="font-medium">{section.title}</h3>
                  <span className="opacity-80">{section.score}/5</span>
                </div>

                {section.questions?.map((q, i) => (
                  <div key={i} className="m-10 text-sm">
                    <p className="font-semibold text-lg text-[#29445D] m-1" ><span className="font-semibold text-lg">Q:</span > {q.question}</p>
                    <p className="text-[#29445D] italic m-1">Feedback: {q.notes}</p>
                    <p className="font-bold text-[#29445D] m-1">Score: {q.score}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendation */}
      <div className="bg-[#F2FAF5]/30 backdrop-blur-xl border border-white/40 rounded-2xl p-6">
        <h2 className="text-lg font-medium mb-2">Recommendation</h2>
        <p className="opacity-80">{recommendation?.title}</p>
        <p className="opacity-60 mt-1">{recommendation?.description}</p>
      </div>

      {/* Modal (UNCHANGED LOGIC) */}
      {showModal && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" > <motion.div initial={{ scale: 0.7, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.7, opacity: 0, y: 50 }} transition={{ type: "spring", stiffness: 120, damping: 12 }} className="bg-[#D1DED3] p-8 rounded-2xl w-[400px] text-center shadow-xl" style={{ fontFamily: "Staatliches, monospace" }} > <h2 className="text-2xl mb-4">Download Report</h2> <p className="text-lg mb-6" style={{ fontFamily: "Barlow Condensed, monospace" }} > Choose report type </p> <div className="flex flex-col gap-4"> {/* Summary Button */} <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowModal(false); handleDownload(false); }} className="bg-[#45767C] text-white py-2 rounded-lg text-xl active:bg-[#2f545a]" style={{ cursor: "pointer" }} > Summary Report </motion.button> {/* Detailed Button */} <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowModal(false); handleDownload(true); }} className="border-2 border-[#45767C] text-[#45767C] py-2 rounded-lg text-xl active:bg-[#45767C] active:text-white" style={{ cursor: "pointer" }} > Detailed Report </motion.button> {/* Cancel */} <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(false)} className="text-sm text-gray-600 mt-2 underline active:text-black" style={{ cursor: "pointer" }} > Cancel </motion.button> </div> </motion.div> </motion.div> )}

    </motion.div>
  );
}