import express from "express";
import fetch from "node-fetch"; 

const router = express.Router();

// POST /api/interview/offer
router.post("/offer", async (req, res) => {
  try {
    const { sdp, type } = req.body;

    // Forward offer to Python AI service
    const response = await fetch("http://localhost:8080/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sdp, type }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Python AI failed" });
    }

    const answer = await response.json();
    return res.json(answer);

  } catch (err) {
    console.error("Interview offer error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


router.post("/api/interview/offer", async (req, res) => {
  try {
    const response = await fetch("http://localhost:8080/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error forwarding offer:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
