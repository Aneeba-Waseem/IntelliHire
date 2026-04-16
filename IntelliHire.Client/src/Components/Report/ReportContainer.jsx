import React, { useState, useRef } from "react";
import ReportModal from "./Standard/ReportModal";
import DetailedReportModal from "./Detailed/DetailedReportPage";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReportContainer({ report, onClose }) {
  const [showDetailed, setShowDetailed] = useState(false);
  const modalRef = useRef();

  if (!report) return null;

  const handleDownloadPDF = async () => {
    const element = modalRef.current;

    // ✅ FIX for oklch issue (force safe colors)
    const originalColor = element.style.color;
    const originalBg = element.style.backgroundColor;

    element.style.color = "#000";
    element.style.backgroundColor = "#fff";

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // restore styles
    element.style.color = originalColor;
    element.style.backgroundColor = originalBg;

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // multi-page support
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${report.candidate || "report"}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="w-[900px] max-h-[90vh] overflow-y-auto bg-[#DDE8E2] rounded-2xl shadow-xl p-6 relative"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl text-gray-600"
        >
          ×
        </button>

        {!showDetailed ? (
          <ReportModal
            report={report}
            onViewDetailed={() => setShowDetailed(true)}
            onDownload={handleDownloadPDF}
          />
        ) : (
          <DetailedReportModal
            report={report}
            onBack={() => setShowDetailed(false)}
            onDownload={handleDownloadPDF}
          />
        )}
      </div>
    </div>
  );
}