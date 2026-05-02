import User from "../models/User.js";
import Interview from "../models/Interview.js";

export const getRemainingTime = async (req, res) => {
  try {
    const { candidateUserId } = req.params;
    
    console.log("🔥 TIME API HIT:", candidateUserId);

    const user = await User.findOne({
      where: { UserId: candidateUserId },
      attributes: ["AutoId"],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const interview = await Interview.findOne({
      where: { candidateUserId: user.AutoId },
    });

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const { date, time, duration } = interview;

    const interviewDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    const diffMs = interviewDateTime - now;
    const totalSeconds = Math.floor(diffMs / 1000);

    const remainingMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    console.log("⏱ remainingSeconds:", totalSeconds);

    return res.json({
      remainingMinutes,
      remainingSeconds,
      scheduledDuration: duration,
    });

  } catch (error) {
    console.error("❌ TIME API ERROR:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};