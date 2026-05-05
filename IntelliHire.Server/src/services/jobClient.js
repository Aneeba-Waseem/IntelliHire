// services/jobCacheService.js
import Interview from "../models/Interview.js"; // ✅ add this
import JobDescription from "../models/JobDescription.js";
import Domain from "../models/Domain.js";
import TechStack from "../models/TechStack.js";
import User from "../models/User.js";

export const getCacheStep1 = async (candidateId, interviewId) => {
  try {
    const user = await User.findOne({
      where: { UserId: candidateId },
      attributes: ["AutoId"],
    });
    // 🔹 1. Get interview for candidate

    const interview = await Interview.findOne({
      where: {
        id: interviewId,
        candidateUserId: user.AutoId
      },
      attributes: ["FK_JobDescription"],
    });

    if (!interview) {
      console.error("No interview found for candidate:", candidateId);
      return null;
    }

    // 🔹 2. Get job using FK_JobDescription
    const job = await JobDescription.findOne({
      where: { id: interview.FK_JobDescription },
      attributes: ["id", "JobRole", "Experience"],
      include: [
        {
          model: Domain,
          attributes: ["id", "name"],
        },
        {
          model: TechStack,
          attributes: ["id", "name"],
        },
      ],
    });

    if (!job) {
      console.error("JobDescription not found");
      return null;
    }

    // 🔹 3. Return structured data
    return {
      jobId: job.id,
      jobRole: job.JobRole,
      experience: job.Experience,
      domains: job.Domains || [],
      techStacks: job.TechStacks || [],
    };

  } catch (error) {
    console.error("cacheStep1 error:", error);
    throw error;
  }
};