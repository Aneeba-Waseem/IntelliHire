import JobDescription from "../models/JobDescription.js";
import Domain from "../models/Domain.js";
import TechStack from "../models/TechStack.js";

export const createJobDescription = async (req, res) => {
  try {
    const { jobRole, domains, techStack, experience, requirements } = req.body;

    const userId = req.user.AutoId;

    if (!jobRole || !techStack || !experience || !userId) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const job = await JobDescription.create({
      FK_Users: userId,
      JobRole: jobRole,
      Experience: experience,
      Requirements: requirements || "",
    });

    // Insert domains
    if (domains && domains.length > 0) {
      const domainRecords = domains.map((d) => ({
        name: d,
        FK_JobDescription: job.id,
      }));
      await Domain.bulkCreate(domainRecords);
    }

    // Insert tech stacks
    if (techStack && techStack.length > 0) {
      const techRecords = techStack.map((t) => ({
        name: t,
        FK_JobDescription: job.id,
      }));
      await TechStack.bulkCreate(techRecords);
    }

    res.status(201).json({ message: "Job Description added successfully", job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
