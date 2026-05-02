import axios from "axios";

const BASE_URL = "http://localhost:8000/api/interview-time";

export const getRemainingTimeAPI = async (token, candidateUserId) => {
  try {
    console.log("🚀 Calling NEW TIME API...");

    const res = await axios.get(
      `${BASE_URL}/remaining-time/${candidateUserId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ TIME RESPONSE:", res.data);
    return res.data;

  } catch (err) {
    console.error("❌ TIME API ERROR:", err.response || err);
    return null;
  }
};