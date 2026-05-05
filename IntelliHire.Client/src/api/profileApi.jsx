import axios from "axios";
import { loadAuthState } from "../features/auth/persistAuth";

const API = axios.create({
  baseURL: "https://intellihire-production.up.railway.app",
});

export const updateProfile = async (data) => {
  const authState = loadAuthState();
  const accessToken = authState?.accessToken;

  return API.put("/api/user/profile", data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getCurrentUser = async () => {
  const authState = loadAuthState();
  const accessToken = authState?.accessToken;

  return API.get("/api/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};