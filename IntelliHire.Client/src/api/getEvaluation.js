import { loadAuthState } from "../features/auth/persistAuth";

export const getEvaluation = async (candidateId, jobId) => {
  const authState = loadAuthState();
   const token = authState?.accessToken;
  const res = await fetch(
    `https://intellihire-production.up.railway.app/api/evaluation/report/${candidateId}/${jobId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch evaluation");

  return res.json();
};