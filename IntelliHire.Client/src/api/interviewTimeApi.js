import axios from "axios";

const BASE_URL = "https://intellihire-production.up.railway.app/api/interview-time";

export const getRemainingTimeAPI = async (token, candidateUserId ,interviewId) => {
  try {
    
    console.log("🚀 Calling NEW TIME API...");
    console.log("interview id at frontend" , interviewId);
    const res = await axios.get(
      `${BASE_URL}/remaining-time/${candidateUserId}`,
      {
         params: {
          interviewId,   // ✅ THIS IS IMPORTANT
        },
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