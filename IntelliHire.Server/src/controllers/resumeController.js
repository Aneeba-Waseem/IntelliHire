import Resume from "../models/Resume.js";
import Qualification from "../models/Qualification.js";
import Experience from "../models/Experience.js";
import Project from "../models/Project.js";
import Interview from "../models/Interview.js";
import JobDescription from "../models/JobDescription.js";

export const getCandidateProfileById = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findByPk(resumeId, {
      include: [
        { model: Qualification },
        { model: Experience },
        { model: Project },

        // ✅ INTERVIEW JOIN
        {
          model: Interview,
          include: [
            {
              model: JobDescription,
              attributes: ["JobRole"], // Role only
            },
          ],
          attributes: ["date", "time", "IsCompleted"],
        },
      ],
    });

    if (!resume) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // 🔥 normalize interview for frontend
    const interview = resume.Interviews?.[0];

    const response = {
      ...resume.toJSON(),

      // ROLE from JD
      job_role: interview?.JobDescription?.JobRole || null,

      // STATUS mapping
      interview_status: interview
        ? interview.IsCompleted
          ? "Completed"
          : "Scheduled"
        : "Not Scheduled",

      // SCHEDULE
      interview_date: interview?.date || null,
      interview_time: interview?.time || null,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};