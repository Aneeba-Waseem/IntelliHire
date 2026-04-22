import React, { useEffect, useState } from "react";

export default function PrintReport() {
  const [report, setReport] = useState(null);
  const [includeDetails, setIncludeDetails] = useState(true);

  useEffect(() => {
  const data = JSON.parse(localStorage.getItem("report"));
  const detailsFlag = JSON.parse(localStorage.getItem("includeDetails"));

  setReport(data);
  setIncludeDetails(detailsFlag);
}, []);

  useEffect(() => {
    if (report) {
      const el = document.createElement("div");
      el.id = "pdf-ready";
      document.body.appendChild(el);
    }
  }, [report]);

  if (!report) return <div>Loading...</div>;

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
    <div
      style={{
        padding: "40px",
        background: "#ffffff",
        color: "#000",
        fontFamily: "Arial",
        lineHeight: "1.6",
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
          INTERVIEW REPORT
        </h1>
        <hr />
      </div>

      {/* META */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
          fontSize: "14px",
        }}
      >
        <div>
          <p><strong>Candidate:</strong> {candidate}</p>
          <p><strong>Duration:</strong> {duration}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p><strong>Role:</strong> {role}</p>
          <p><strong>Score:</strong> {score}/5</p>
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
          SCORE SUMMARY
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={th}>Domain</th>
              <th style={th}>Score</th>
              <th style={th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {summary.length ? (
              summary.map((item, i) => (
                <tr key={i}>
                  <td style={td}>{item.domain}</td>
                  <td style={td}>{item.score}</td>
                  <td style={td}>{item.notes}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={td}>No summary available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* STRENGTHS / WEAKNESSES */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          marginBottom: "30px",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3>STRENGTHS</h3>
          <ul>
            {strengths.length ? (
              strengths.map((s, i) => <li key={i}>{s}</li>)
            ) : (
              <li>No strengths listed</li>
            )}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          <h3>WEAKNESSES</h3>
          <ul>
            {weaknesses.length ? (
              weaknesses.map((w, i) => <li key={i}>{w}</li>)
            ) : (
              <li>No weaknesses listed</li>
            )}
          </ul>
        </div>
      </div>

      {/* DETAILS */}
      {includeDetails && (<div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
          DETAILS
        </h2>

        {sections.length ? (
          sections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #ccc",
                  marginBottom: "10px",
                }}
              >
                <strong>{section.title?.toUpperCase()}</strong>
                <span>{section.score}/5</span>
              </div>

              {section.questions?.map((q, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "10px",
                    pageBreakInside: "avoid",
                  }}
                >
                  <p><strong>Q{i + 1}:</strong> {q.question}</p>
                  <p><strong>Feedback:</strong> {q.feedback}</p>
                  <p><strong>Score:</strong> {q.score}</p>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p>No detailed sections available</p>
        )}
      </div>)}

      {/* RECOMMENDATION */}
      <div>
        <h2 style={{ fontSize: "20px" }}>RECOMMENDATION</h2>
        <p><strong>{recommendation?.title || "N/A"}</strong></p>
        <p>{recommendation?.description || "No recommendation provided"}</p>
      </div>
    </div>
  );
}

/* Reusable styles */
const th = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
};

const td = {
  border: "1px solid #ccc",
  padding: "8px",
};