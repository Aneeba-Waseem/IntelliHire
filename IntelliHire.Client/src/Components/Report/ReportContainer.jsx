import React, { useRef } from "react";
import ReportModal from "./Standard/ReportModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";

export default function ReportContainer({ report, onClose }) {
  const modalRef = useRef();
  const navigate = useNavigate();

  if (!report) return null;

  const handleOpenDetailed = () => {
    navigate("/report/detailed", { state: report });
  };

  const handleDownload = async () => {
    const element = modalRef.current;

    const clone = element.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.background = "#fff";

    clone.querySelectorAll("button").forEach(b => b.remove());

    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff",
    });

    document.body.removeChild(clone);

    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "PNG", 0, 0, 210, 0);
    pdf.save(`${report.candidate || "report"}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div
        ref={modalRef}
        className="w-[900px] max-h-[90vh] overflow-y-auto bg-[#DDE8E2] rounded-2xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
        >
          ×
        </button>

        <ReportModal
          report={report}
          onViewDetailed={handleOpenDetailed}
          onDownload={handleDownload}
        />
      </div>

    </div>
  );
}