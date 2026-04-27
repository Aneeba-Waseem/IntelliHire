// src/api/flowAPI.js
const API_BASE = "https://intellihire-production.up.railway.app/api/flow";

export const startInterview = async (token, candidateId = "cand_12345", jobId = "job_67890", candidateType = "generic") => {
    console.log("Starting interview with candidateId:", candidateId, "jobId:", jobId, "candidateType:", candidateType , "token:", token );
    const res = await fetch(`${API_BASE}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ candidateId, jobId, candidateType, token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to start interview");
  return data.data;
};

export const submitAnswer = async (token, sessionId, answer) => {
  console.log("in the submitAnswer function for sessionId:", token, "answer:", answer);
  const res = await fetch(`${API_BASE}/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId, answer }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to submit answer");
  return data.data;
};

export const getReport = async (token, sessionId) => {
  const res = await fetch(`${API_BASE}/report/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch report");
  return data.data;
};