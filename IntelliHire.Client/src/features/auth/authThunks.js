import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:8000/api/auth";

// ----------------- THUNKS -----------------

// Register
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/register`, userData);
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Server error";
      return rejectWithValue(msg);
    }
  }
);


// Login
export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (credentials, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_URL}/login`, credentials);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: "Server error" });
        }
    }
);

// Refresh access token
export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = getState().auth.refreshToken;

      const res = await axios.post(`${API_URL}/refresh`, {
        refreshToken,
      });

      return res.data.accessToken;
    } catch (err) {
      return rejectWithValue(err.response?.data || { error: "Could not refresh token" });
    }
  }
);


// Logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async (accessToken) => {
    await axios.post(`${API_URL}/logout`, { accessToken });
    return null;
});
