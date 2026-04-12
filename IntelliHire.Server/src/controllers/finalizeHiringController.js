import sequelize from "../config/db.js";
import JobDescription from "../models/JobDescription.js";
import Domain from "../models/Domain.js";
import TechStack from "../models/TechStack.js";
import Resume from "../models/Resume.js";
import Qualification from "../models/Qualification.js";
import Experience from "../models/Experience.js";
import Project from "../models/Project.js";
import Interview from "../models/Interview.js";
import { redisClient as redis } from "../config/redisClient.js";
import { sendInterviewEmails } from "../routes/interviewEmail.js";

//to get data from cache of JD , resume and final timings of interview.
export const finalizeHiring = async (req, res) => {
    const { batchId, interviews } = req.body;
    const userId = req.user.AutoId; // comes from authMiddleware
    console.log("user ki id ", userId);
    console.log("interviews", interviews)
    // ✅ Use the Sequelize instance directly
    const t = await sequelize.transaction();
    const normalizeTechStack = (tech) => {
        if (!tech) return [];

        // already array
        if (Array.isArray(tech)) return tech;

        // if string → convert to array
        if (typeof tech === "string") {
            return tech.split(",").map(t => t.trim());
        }

        return [];
    };

    try {
        const step1 = JSON.parse(await redis.get(`job:${userId}:step1`));

        const job = await JobDescription.create({
            FK_Users: userId,
            JobRole: step1.jobRole,
            Experience: step1.experience,
            Requirements: step1.requirements,
        }, { transaction: t });

        // Remove duplicates
        for (let d of [...new Set(step1.domains)]) {
            await Domain.create({ name: d, FK_JobDescription: job.id }, { transaction: t });
        }

        for (let tStack of [...new Set(step1.techStack)]) {
            await TechStack.create({ name: tStack, FK_JobDescription: job.id }, { transaction: t });
        }

        const batchId = await redis.get(`job:${userId}:step2:batchId`);
        const resumes = await redis.hGetAll(batchId); // ✅ correct for node-redis v4+

        const shortlistedIds = interviews.map(i => i.resume_id);

        for (const key in resumes) {
            const data = JSON.parse(resumes[key]);
            if (!shortlistedIds.includes(data.resume_id)) continue;

            const r = data.parsed_resume;

            const resume = await Resume.create({
                id: data.resume_id,
                FK_JobDescription: job.id,
                name: r.name,
                email: r.contact_info?.email,
                phone: r.contact_info?.phone,
                github_link: r.github_link,
                linkedin: r.linkedin,
                coursework_keywords: r.coursework_keywords,
                skills_summary: r.skills_summary,
                matching_score: data.matching?.score,
                is_shortlisted: true,
            }, { transaction: t });

            await Qualification.create({ FK_Resume: resume.id, degree_name: r.qualification, institute: r.university }, { transaction: t });
            for (let exp of r.experience || []) {
                await Experience.create({ FK_Resume: resume.id, title: exp.title, organization: exp.organization || exp.company, description: exp.description }, { transaction: t });
            }
            for (let p of r.projects || []) {
                await Project.create({
                    FK_Resume: resume.id,
                    name: p.name,
                    description: p.description,
                    tech_stack: normalizeTechStack(p.tech_stack), // ✅ FIX
                    link: p.link
                }, { transaction: t });
            }
        }

        for (let i of interviews) {
            await Interview.create({ FK_JobDescription: job.id, FK_Resume: i.resume_id, FK_Users: userId, date: i.date, time: i.time, duration: 30, IsCompleted: false }, { transaction: t });
        }

        await sendInterviewEmails(interviews);
        await t.commit();

        res.json({ message: "Hiring data saved successfully" });
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ error: "Failed to save data" });
    }

};