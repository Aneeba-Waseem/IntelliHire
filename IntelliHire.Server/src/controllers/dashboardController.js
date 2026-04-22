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
            jobDescriptionId: i.FK_JobDescription,
            resumeId: i.FK_Resume || "id not defined",
            company: i.User?.company || "Unknown Company",
            role: i.JobDescription?.JobRole || "Role",
            date: i.date,
            time: i.time,
            duration: i.duration,
            Candidate: i.Resume?.name || "Candidate",
            isCompleted: i.IsCompleted,
        }));
        res.json({
            total,
            completed,
            pending,
            completedPercentage,
            scheduledData: domainData, // 🔥 IMPORTANT
            interviews: interviewsList,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Dashboard fetch failed" });
    }
};