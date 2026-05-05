// frontend/api/JobApi.js
import axios from "axios";
import { loadAuthState } from "../features/auth/persistAuth";
const BASE_URL = "https://intellihire-production.up.railway.app/api";

/* =====================================================
   Helper: Get Auth Headers
===================================================== */
const getAuthHeaders = () => {
  const authState = loadAuthState();
  const accessToken = authState?.accessToken;
  console.log(accessToken);

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
};

/* =====================================================
   LIST APIs
===================================================== */

// Fetch domains
export const fetchDomains = async () => {
  try {
    const res = await fetch(`${BASE_URL}/lists/domains`);
    if (!res.ok) throw new Error("Failed to fetch domains");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

// Fetch tech stacks
export const fetchTechStacks = async () => {
  try {
    const res = await fetch(`${BASE_URL}/lists/techstacks`);
    if (!res.ok) throw new Error("Failed to fetch tech stacks");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

/* =====================================================
   STEP 1 CACHE (Job Description)
===================================================== */

// Save Step1 to Redis
export const saveStep1Cache = async (data) => {
  const res = await fetch(`${BASE_URL}/jobCache/cacheStep1`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to cache Step 1");
  return res.json();
};

// Get Step1 from Redis
export const getStep1Cache = async () => {
  const res = await fetch(`${BASE_URL}/jobCache/cacheStep1`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch cached Step 1");
  return res.json();
};

/* =====================================================
   STEP 2 CACHE (Resume Selection)
===================================================== */

export const saveStep2BatchId = async (batchId) => {
  const res = await fetch("https://intellihire-production.up.railway.app/api/jobCache/cacheStep2Batch", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ batchId }),
  });
  return res.json();
};

export const getStep2BatchId = async () => {
  const res = await fetch("https://intellihire-production.up.railway.app/api/jobCache/cacheStep2Batch", {
    headers: getAuthHeaders(),
  });
  return res.json(); // { batchId }
};


export const clearAllCacheAPI = async (batchId) => {
  const authState = loadAuthState();
  const userId = authState?.user?.userId;

  const res = await fetch(`https://intellihire-production.up.railway.app/api/cache/clearAll`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ batchId, userId }),
  });

  return res.json();
};


/* =====================================================
   OPTIONAL: Save Job to DB
===================================================== */

export const saveJobDescription = async (data) => {
  try {
    const res = await fetch(`${BASE_URL}/job-description/createJob`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to save job description");
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const getJobDescription = async (id) => {
  const authState = loadAuthState();
  const token = authState?.accessToken;
  console.log("Token in getDashboardData:", token);

  const res = await axios.get(`${BASE_URL}/job-description/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// src/api/JobApi.js
export const getJobInterviewStats = async (jobId) => {
  try {
    const authState = loadAuthState();
    const token = authState?.accessToken;
    console.log("Token in getDashboardData:", token);

    const res = await axios.get(
      `${BASE_URL}/job-description/job/${jobId}/interviews`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("Error fetching job interview stats:", err);
    throw err;
  }
};