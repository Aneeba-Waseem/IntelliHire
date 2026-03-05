// api/resume_api.js

// const PYTHON_BASE = "http://localhost:8001";
const NODE_BASE = "http://localhost:8000";
export const scheduleInterviewsAPI = async (batchId, interviews) => {
  const res = await fetch(
    `${NODE_BASE}/api/interview-email/send-interview-emails`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviews }),
    }
  );

  if (!res.ok) throw new Error("Failed to schedule interviews");
  return res.json();
};