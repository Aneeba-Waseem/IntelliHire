import JobDescription from "../models/JobDescription.js";
import Domain from "../models/Domain.js";
import TechStack from "../models/TechStack.js";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import Interview from "../models/Interview.js";

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

export const getJobDescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await JobDescription.findByPk(id, {
      include: [
        {
          model: TechStack,
          attributes: ["id","name"],
        },
        {
          model: Domain,
          attributes: ["id","name"],
        },
        {
          model: User,
          attributes: ["AutoId" , "fullName","company"],
        },
      ],
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch job description" });
  }
};

export const getJobInterviewStats = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.AutoId;

    const interviews = await Interview.findAll({
      where: {
        FK_JobDescription: jobId,
        FK_Users: userId, // security
      },
      include: [
        {
          model: Resume,
          attributes: ["name"],
        },
        {
          model: User,
          attributes: ["company"],
        },
      ],
    });

    const total = interviews.length;
    const completed = interviews.filter(i => i.IsCompleted).length;
    const scheduled = total - completed;

    return res.json({
      jobId,
      total,
      completed,
      scheduled,
      interviews,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch job interview stats" });
  }
};