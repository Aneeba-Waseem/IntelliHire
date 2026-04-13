import React from "react";

export default function SummarySection({
  strengths,
  concerns,
  recommendation,
}) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <h4 className="font-semibold">Top Strengths</h4>
        <ul className="list-disc ml-5">
          {strengths.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold">Top Concerns</h4>
        <ul className="list-disc ml-5">
          {concerns.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold">Recommendation</h4>
        <p>{recommendation}</p>
      </div>
    </div>
  );
}