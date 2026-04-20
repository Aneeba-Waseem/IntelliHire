import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function DetailedReportPage() {
  const navigate = useNavigate();
  const { state: report } = useLocation();
  const pageRef = useRef();

  if (!report) {
    return (
      <div className="p-6 text-gray-600">
        No report found.
      </div>
    );
  }

  const handleDownload = async () => {
    const element = pageRef.current;

    const clone = element.cloneNode(true);

    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.background = "#fff";
    clone.style.width = "900px";

    clone.querySelectorAll("button").forEach((b) => b.remove());

    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff",
    });

    document.body.removeChild(clone);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 👇 THIS IS THE IMPORTANT FIX
    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.candidate || "report"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
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
    <div ref={pageRef} className="min-h-screen bg-[#D1DED3] p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#45767C] underline"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold">DETAILED REPORT</h1>

        <button
          onClick={handleDownload}
          className="bg-[#45767C] text-white px-4 py-2 rounded-xl"
        >
          Download
        </button>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p><strong>Candidate:</strong> {candidate}</p>
          <p><strong>Duration:</strong> {duration}</p>
        </div>

        <div className="text-right">
          <p><strong>Role:</strong> {role}</p>
          <p><strong>Score:</strong> {score}/5</p>
        </div>
      </div>

      {/* Score Summary */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-2">SCORE SUMMARY</h2>

        <div className="bg-[#cbd9d0] rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 font-semibold border-b p-3">
            <div>DOMAIN</div>
            <div>SCORE</div>
            <div>NOTES</div>
          </div>

          {summary.length ? summary.map((item, i) => (
            <div key={i} className="grid grid-cols-3 p-3 border-t text-sm">
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
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-bold mb-2">STRENGTHS</h3>
          <ul className="list-disc ml-5">
            {strengths.length ? strengths.map((s, i) => <li key={i}>{s}</li>) : (
              <li className="text-gray-500">No strengths listed</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-2">WEAKNESSES</h3>
          <ul className="list-disc ml-5">
            {weaknesses.length ? weaknesses.map((w, i) => <li key={i}>{w}</li>) : (
              <li className="text-gray-500">No weaknesses listed</li>
            )}
          </ul>
        </div>
      </div>

      {/* Details */}
      <div>
        <h2 className="font-bold text-lg mb-4">DETAILS</h2>

        {sections.length ? sections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <div className="flex justify-between font-bold">
              <h3>{section.title?.toUpperCase()}</h3>
              <span>{section.score}/5</span>
            </div>

            {section.questions?.map((q, i) => (
              <div key={i} className="mt-3 text-sm">
                <p><strong>Q{i + 1}:</strong> {q.question}</p>
                <p><strong>Feedback:</strong> {q.feedback}</p>
                <p><strong>Score:</strong> {q.score}</p>
              </div>
            ))}
          </div>
        )) : (
          <p className="text-sm text-gray-500">
            No detailed sections available
          </p>
        )}
      </div>

      {/* Recommendation */}
      <div className="mt-6">
        <h2 className="font-bold text-lg">RECOMMENDATION</h2>
        <p className="font-bold mt-1">{recommendation?.title || "N/A"}</p>
        <p className="text-sm mt-2">
          {recommendation?.description || "No recommendation provided"}
        </p>
      </div>

    </div>
  );
}