import { loadAuthState, saveAuthState } from "../features/auth/persistAuth";

const API_BASE = "http://localhost:8000/api";

export const authFetch = async (url, options = {}) => {
  let authState = loadAuthState();
  let accessToken = authState?.accessToken;
  let refreshToken = authState?.refreshToken;
  

  // Attach access token
  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  console.log("authFetch called");


  let response = await fetch(API_BASE + url, options);

  // If access token expired
  if (response.status === 401 && refreshToken) {
    console.log("Access token expired → calling refresh");

    // Call refresh API
    const refreshRes = await fetch(API_BASE + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      const newAccessToken = data.accessToken;

      // Save new token
      authState.accessToken = newAccessToken;
      saveAuthState(authState);

      // Retry original request
      options.headers.Authorization = `Bearer ${newAccessToken}`;
      response = await fetch(API_BASE + url, options);
    } else {
      // Refresh failed → logout required
      localStorage.removeItem("authState");
      window.location.href = "/login";
      return;
    }
  }

  return response;
};


// if refresh token expires go to login pageeee. (left)