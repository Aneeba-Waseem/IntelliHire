import { loadAuthState } from "../features/auth/persistAuth";

const NODE_BASE = "https://intellihire-production.up.railway.app";

export const scheduleInterviewsAPI = async (batchId, interviews) => {
   const authState = loadAuthState();
    const token = authState?.accessToken;
console.log("token from calling schelude interview and add to db", token)
  const res = await fetch(`${NODE_BASE}/api/finalizeHiring`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ send token
    },
    body: JSON.stringify({batchId, interviews}),
  });

  if (!res.ok) throw new Error("Failed to finalize hiring process");
  return res.json();
};