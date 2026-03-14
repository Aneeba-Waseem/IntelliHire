import { loadAuthState, saveAuthState } from "../features/auth/persistAuth";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";
const TOKEN_REFRESH_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

let refreshTimer = null;
let isRefreshing = false;
let refreshPromise = null;

// ─── Core refresh logic ───────────────────────────────────────────────────────
const doRefresh = async () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    redirectToLogin();
    return null;
  }

  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  console.log("Refresh response status:", refreshRes.status);

  if (refreshRes.ok) {
    const data = await refreshRes.json();
    localStorage.setItem("accessToken", data.accessToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
    scheduleTokenRefresh();
    return data.accessToken;
  } else {
    redirectToLogin();
    return null;
  }
};

// ─── Refresh with race condition guard ───────────────────────────────────────
const refreshAccessToken = () => {
  if (isRefreshing) return refreshPromise;
  isRefreshing = true;
  refreshPromise = doRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
};

// ─── Proactive scheduler (call once on app startup / login) ──────────────────
export const scheduleTokenRefresh = () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    console.log("Proactive token refresh at 14th minute");
    await refreshAccessToken();
  }, TOKEN_REFRESH_INTERVAL_MS);
};

export const cancelTokenRefresh = () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
};

// ─── Redirect helper ─────────────────────────────────────────────────────────
const redirectToLogin = () => {
  cancelTokenRefresh();
  localStorage.removeItem("accessToken");
  window.location.href = "/auth";
};

// ─── Main fetch wrapper ───────────────────────────────────────────────────────
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

  let response = await fetch(API_BASE + url, requestOptions);

  if (response.status === 401) {
    console.warn("401 received → attempting reactive refresh");
    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) return;
    requestOptions.headers.Authorization = `Bearer ${newAccessToken}`;
    response = await fetch(API_BASE + url, requestOptions);
  }

  return response;
};