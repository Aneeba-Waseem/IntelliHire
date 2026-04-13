// api/resume_api.js

import axios from "axios";
import { loadAuthState } from "../features/auth/persistAuth";

const PYTHON_BASE = "http://localhost:8001";
const NODE_BASE = "http://localhost:8000";

/* ---------------- Resume Upload ---------------- */
export const uploadResumes = async (files, jdText, batchId = null) => {
  const form = new FormData();

  files.forEach(f => form.append("files", f));
  form.append("jd_text", jdText);

  if (batchId) {
    form.append("batch_id", batchId);
  }

  const res = await fetch("http://localhost:8001/api/resumes/upload", {
    method: "POST",
    body: form,
  });

  return res.json();
};


/* ---------------- Status Polling ---------------- */
export const getBatchStatus = async (batchId) => {
  const res = await fetch(`${PYTHON_BASE}/api/resumes/status/${batchId}`);
  return res.json();
};

/* ---------------- Start Matching ---------------- */
export const startMatchingAPI = async (batchId, jdText) => {
  const res = await fetch(`${PYTHON_BASE}/api/resumes/match/${batchId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd_text: jdText })
  });

  return res.json();
};

/* ---------------- Get JD from Node ---------------- */
export const getJDFromCache = async (token) => {
  const res = await fetch(`${NODE_BASE}/api/jobCache/cacheStep1`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
};


export const getProfiles = async (batchId) => {
  const res = await fetch(`http://localhost:8001/api/resumes/profiles/${batchId}`);
  return res.json();
};



export const updateShortlistAPI = async (batchId, resumeId, isShortlisted) => {
  const res = await fetch(`${PYTHON_BASE}/api/resumes/shortlist/${batchId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_id: resumeId,
      is_shortlisted: isShortlisted,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to update shortlist");
  }

  return res.json();
};

export const getCandidateProfile = async (resumeId) => {
  try {
    const authState = loadAuthState();
    const token = authState?.accessToken;

    console.log("Token in getCandidateProfile:", token);

    const res = await axios.get(
      `${NODE_BASE}/api/resume/${resumeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};