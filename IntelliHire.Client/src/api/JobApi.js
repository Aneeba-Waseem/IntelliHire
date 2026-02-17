// frontend/api/JobApi.js
import { loadAuthState } from "../features/auth/persistAuth";
import { authFetch } from "./authFetch";

// Fetch domains
export const fetchDomains = async () => {
  try {
    const res = await fetch("http://localhost:8000/api/lists/domains");
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
    const res = await fetch("http://localhost:8000/api/lists/techstacks");
    if (!res.ok) throw new Error("Failed to fetch tech stacks");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};
export const saveStep1Cache = async (data) => {
  const authState = loadAuthState();
  const accessToken = authState?.accessToken;

  const res = await fetch("http://localhost:8000/api/jobCache/cacheStep1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to cache Step 1");
  return res.json();
};

export const getStep1Cache = async () => {
  const authState = loadAuthState();
  const accessToken = authState?.accessToken;

  const res = await fetch("http://localhost:8000/api/jobCache/cacheStep1", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch cached Step 1");
  return res.json();
};

// Save job description (optional)
export const saveJobDescription = async (data) => {
  try {
    // const accessToken = localStorage.getItem("accessToken");
    // const accessToken = obj?.accessToken;
    const authState = loadAuthState();
    const accessToken = authState?.accessToken; //
    console.log("AccessToken being sent:", accessToken); // 👈 add this

    const res = await fetch("/job-description/createJob", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${accessToken}` // attach JWT
        "Authorization": `Bearer ${accessToken}` // must send JWT here

      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save job description");
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
};


export const saveStep2Cache = async (data) => {
  const authState = loadAuthState();
  const accessToken = authState?.accessToken;

  const res = await fetch("http://localhost:8000/api/jobCache/cacheStep2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to cache Step 2");
  return res.json();
};

export const getStep2Cache = async () => {
  const authState = loadAuthState();
  const accessToken = authState?.accessToken;

  const res = await fetch("http://localhost:8000/api/jobCache/cacheStep2", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch cached Step 2");
  return res.json();
};
