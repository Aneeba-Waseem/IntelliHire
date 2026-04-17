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
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{ color: "#45767C", textDecoration: "underline", fontSize: "12px" }}
      >
        ← Back to Summary
      </button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1, color: "#374151" }}>
          DETAILED REPORT
        </h1>

        <button
          onClick={onDownload}
          style={{
            backgroundColor: "#45767C",
            color: "#ffffff",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Download Report
        </button>
      </div>

      {/* Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, color: "#374151", marginBottom: 24 }}>
        <div>
          <p><strong>Candidate:</strong> {candidate}</p>
          <p><strong>Duration:</strong> {duration}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p><strong>Role:</strong> {role}</p>
          <p><strong>Candidate Score:</strong> {score} / 5</p>
        </div>
      </div>

      {/* Score Summary */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8, color: "#111827" }}>
          SCORE SUMMARY:
        </h2>

        <p style={{ fontSize: 12, color: "#4B5563", textAlign: "right", marginBottom: 8 }}>
          (Overall Score scale: 1-5)
        </p>

        <div style={{ backgroundColor: "#dfe7e5", borderRadius: 8, overflow: "hidden" }}>
          
          {/* Header Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 2fr",
            fontWeight: "bold",
            padding: 10,
            borderBottom: "1px solid #ccc",
            fontSize: 13,
            color: "#111827",
          }}>
            <div>DOMAIN</div>
            <div>SCORE</div>
            <div>NOTES</div>
          </div>

          {/* Rows */}
          {summary.length > 0 ? (
            summary.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 2fr",
                  padding: 10,
                  borderTop: "1px solid #e5e7eb",
                  fontSize: 12,
                  color: "#374151",
                }}
              >
                <div>{item.domain}</div>
                <div>{item.score}</div>
                <div>{item.notes}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: 10, fontSize: 12, color: "#6B7280" }}>
              No summary available
            </div>
          )}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        
        <div>
          <h3 style={{ fontWeight: "bold", marginBottom: 8, color: "#111827" }}>
            STRENGTHS:
          </h3>

          <ul style={{ paddingLeft: 18, color: "#374151", fontSize: 12 }}>
            {strengths.length > 0 ? (
              strengths.map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li style={{ color: "#6B7280" }}>No strengths listed</li>
            )}
          </ul>
        </div>

        <div>
          <h3 style={{ fontWeight: "bold", marginBottom: 8, color: "#111827" }}>
            WEAKNESSES:
          </h3>

          <ul style={{ paddingLeft: 18, color: "#374151", fontSize: 12 }}>
            {weaknesses.length > 0 ? (
              weaknesses.map((w, i) => <li key={i}>{w}</li>)
            ) : (
              <li style={{ color: "#6B7280" }}>No weaknesses listed</li>
            )}
          </ul>
        </div>
      </div>

      {/* Details */}
      <div>
        <h2 style={{ fontWeight: "bold", marginBottom: 12, color: "#111827" }}>
          DETAILS:
        </h2>

        {sections.length > 0 ? (
          sections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: 20 }}>
              
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: 8,
              }}>
                <h3>{section.title?.toUpperCase()}</h3>
                <span>{section.score} / 5</span>
              </div>

              {section.questions?.map((q, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 10, color: "#374151" }}>
                  <p><strong>Q{i + 1}:</strong> {q.question}</p>
                  <p><strong>Feedback:</strong> {q.feedback}</p>
                  <p><strong>Score:</strong> {q.score} / 5</p>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p style={{ fontSize: 12, color: "#6B7280" }}>
            No detailed sections available
          </p>
        )}
      </div>

      {/* Recommendation */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontWeight: "bold", color: "#111827" }}>
          RECOMMENDATION:
        </h2>

        <p style={{ fontWeight: "bold", marginTop: 6, color: "#374151" }}>
          {recommendation?.title || "N/A"}
        </p>

        <p style={{ fontSize: 12, marginTop: 8, color: "#4B5563" }}>
          {recommendation?.description || "No recommendation provided"}
        </p>
      </div>
    </>
  );
}