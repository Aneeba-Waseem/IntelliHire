import Interview from "../models/Interview.js";
import JobDescription from "../models/JobDescription.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js";

export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.AutoId;

        const interviews = await Interview.findAll({
            where: { FK_Users: userId },
            include: [
                {
                    model: JobDescription,
                    attributes: ["JobRole"],
                },
                {
                    model: Resume, // ✅ ADD THIS
                    attributes: ["name"],
                },
                {
                    model: User,
                    attributes: ["company"],   // ✅ FIX HERE
                },
            ],
        });

        const total = interviews.length;

        const completed = interviews.filter(i => i.IsCompleted).length;
        const pending = total - completed;

        // 🔥 GROUP BY JOB ROLE
        const roleMap = {};

        interviews.forEach((i) => {
            const role = i.JobDescription?.JobRole || "Unknown";

            if (!roleMap[role]) roleMap[role] = 0;
            roleMap[role]++;
        });

        const domainData = Object.keys(roleMap).map((role) => ({
            name: role,
            value: roleMap[role],
        }));

        const completedPercentage = total ? (completed / total) * 100 : 0;
        const interviewsList = interviews.map((i) => ({
            id: i.id,
            company: i.User?.company || "Unknown Company",
            role: i.JobDescription?.JobRole || "Role",
            date: i.date,
            time: i.time,
            duration: i.duration,
            Candidate: i.Resume?.name || "Candidate",
            isCompleted: i.IsCompleted,

            // 🔥 ADD THIS
            candidateProfile: {
                name: i.Resume?.name || "Unknown Candidate",
                email: i.Resume?.email || "",
                skills_summary: i.Resume?.skills_summary || [],
                coursework_keywords: i.Resume?.coursework_keywords || [],
                linkedin: i.Resume?.linkedin || "",
                github_link: i.Resume?.github_link || "",
            },
        }));
        res.json({
            total,
            completed,
            pending,
            completedPercentage,
            scheduledData: domainData, // 🔥 IMPORTANT
            interviews: interviewsList,
            // candidateProfile: CandidateProfile
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Dashboard fetch failed" });
    }
};