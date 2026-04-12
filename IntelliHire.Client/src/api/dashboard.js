import axios from "axios";
import { loadAuthState } from "../features/auth/persistAuth";

const API = "http://localhost:8000/api/dashboard";

export const getDashboardData = async () => {
    const authState = loadAuthState();
    const token = authState?.accessToken;
    console.log("Token in getDashboardData:", token);
    const res = await axios.get(API, {
        headers: {
        Authorization: `Bearer ${token}`,
        },
    });

  return res.data;
};