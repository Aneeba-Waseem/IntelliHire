import axios from "axios";

const API_BASE = "http://localhost:8000/api";

// ─── Core refresh logic ───────────────────────────────────────────────────────
export const refreshAccessToken = async () => {
  const accessToken = localStorage.getItem("accessToken");
  
  if (!accessToken) {
    redirectToLogin();
    throw new Error("No access token found");
  }

  try {
    const response = await axios.post(`${API_BASE}/auth/refresh`, {
      accessToken,
    });

    console.log("Refresh response status:", response.status);

    const data = response.data;
    localStorage.setItem("accessToken", data.accessToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
    
    return data.accessToken;
  } catch (error) {
    console.error("Refresh error:", error);
    redirectToLogin();
    throw error;
  }
};

// ─── Redirect helper ──────────────────────────────────────────────────────────
const redirectToLogin = () => {
  localStorage.removeItem("accessToken");
  window.location.href = "/auth";
};

// ─── Main fetch wrapper (reactive 401 handling) ───────────────────────────────
export const authFetch = async (url, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");
  
  const requestOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  try {
    let response = await fetch(API_BASE + url, requestOptions);

    // If 401, attempt refresh and retry
    if (response.status === 401) {
      console.warn("401 received → attempting reactive refresh");
      try {
        const newAccessToken = await refreshAccessToken();
        requestOptions.headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(API_BASE + url, requestOptions);
      } catch (refreshError) {
        // Refresh failed, redirect happens inside refreshAccessToken
        throw refreshError;
      }
    }

    return response;
  } catch (error) {
    console.error("authFetch error:", error);
    throw error;
  }
};