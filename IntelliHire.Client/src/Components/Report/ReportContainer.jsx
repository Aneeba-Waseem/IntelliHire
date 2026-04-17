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

  // 1. Clone the entire UI (important: keeps exact layout)
  const clone = element.cloneNode(true);

  // 2. Put clone off-screen
  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.background = "#ffffff";
  clone.style.color = "#000000";

  // 3. HARD RESET computed-style issues (THIS is what fixes oklch)
  const allNodes = clone.querySelectorAll("*");

  allNodes.forEach((el) => {
    const style = window.getComputedStyle(el);

    // force-safe colors only if problematic
    if (style.color && style.color.includes("oklch")) {
      el.style.color = "#000000";
    }

    if (style.backgroundColor && style.backgroundColor.includes("oklch")) {
      el.style.backgroundColor = "transparent";
    }

    // kill problematic effects
    el.style.boxShadow = "none";
    el.style.filter = "none";
  });

  document.body.appendChild(clone);

  // 4. Render clone
  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(clone);

  // 5. PDF generation (unchanged)
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

  pdf.save(`${report.candidate || "report"}.pdf`);
};

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
      ref={modalRef}
      data-pdf-root="true"
      className="w-[900px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-6 relative"
      style={{ backgroundColor: "#ffffff", color: "#000000" }}
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