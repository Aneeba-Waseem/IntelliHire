import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

// ----------------- THUNKS -----------------

// Register
export const registerUser = createAsyncThunk(
    "auth/registerUser",
    async (userData, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_URL}/register`, userData);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: "Server error" });
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
    async (oldAccessToken, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_URL}/refresh`, { accessToken: oldAccessToken });
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
