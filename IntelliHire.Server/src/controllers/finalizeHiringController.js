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

import User from "../models/User.js";
import MagicLink from "../models/magicLink.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export const finalizeHiring = async (req, res) => {
    const { interviews } = req.body;
    const userIdUUID = req.user.UserId;
    const userId = req.user.AutoId;

    const t = await sequelize.transaction();

    const normalizeTechStack = (tech) => {
        if (!tech) return [];
        if (Array.isArray(tech)) return tech;
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

        for (let d of [...new Set(step1.domains)]) {
            await Domain.create(
                { name: d, FK_JobDescription: job.id },
                { transaction: t }
            );
        }

        for (let tStack of [...new Set(step1.techStack)]) {
            await TechStack.create(
                { name: tStack, FK_JobDescription: job.id },
                { transaction: t }
            );
        }

        const batchId = await redis.get(`job:${userId}:step2:batchId`);
        const resumes = await redis.hGetAll(batchId);

        const shortlistedIds = interviews.map(i => i.resume_id);

        // map for fast lookup
        const interviewMap = new Map();
        for (let i of interviews) {
            interviewMap.set(i.resume_id, i);
        }

        const emailPayload = [];

        for (const key in resumes) {

            const data = JSON.parse(resumes[key]);
            if (!shortlistedIds.includes(data.resume_id)) continue;

            const r = data.parsed_resume;
// ================= USER =================
            let user = await User.findOne({
                where: { email: r.contact_info?.email }
            });

            if (!user) {
                const randomPassword = await bcrypt.hash("Temp@1234", 10);

                user = await User.create({
                    fullName: r.name,
                    email: r.contact_info?.email,
                    password: randomPassword,
                    company: "N/A",
                    Role: "candidate",
                    isVerified: true,
                }, { transaction: t });

            } else {
                if (user.Role === "recruiter") {
                    user.Role = "both";
                    await user.save({ transaction: t });
                }
            }
            const resume = await Resume.create({
                id: data.resume_id,
                Fk_Candidate: user.AutoId,
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

            await Qualification.create({
                FK_Resume: resume.id,
                degree_name: r.qualification,
                institute: r.university
            }, { transaction: t });

            for (let exp of r.experience || []) {
                await Experience.create({
                    FK_Resume: resume.id,
                    title: exp.title,
                    organization: exp.organization || exp.company,
                    description: exp.description
                }, { transaction: t });
            }

            for (let p of r.projects || []) {
                await Project.create({
                    FK_Resume: resume.id,
                    name: p.name,
                    description: p.description,
                    tech_stack: normalizeTechStack(p.tech_stack),
                    link: p.link
                }, { transaction: t });
            }

            

            // ================= INTERVIEW CHECK =================
            const exists = await Interview.findOne({
                where: {
                    FK_JobDescription: job.id,
                    candidateUserId: user.AutoId,
                }
            });
            if (exists) continue;

            const iData = interviewMap.get(data.resume_id);
            const recruiter = await User.findOne({
                where: { UserId: userIdUUID }
            });
            // ================= INTERVIEW =================
            const interview = await Interview.create({
                FK_JobDescription: job.id,
                FK_Resume: resume.id,
                FK_Users: userId,
                candidateUserId: user.AutoId,
                date: iData?.date,
                time: iData?.time,
                duration: 30,
                IsCompleted: false
            }, { transaction: t });

            // ================= MAGIC LINK =================
            const token = uuidv4();

            await MagicLink.create({
                token,
                FK_userId: user.UserId,
                expiresAt: new Date(Date.now() + 1000 * 60 * 120),
                isUsed: false,
            }, { transaction: t });

            const link = `http://localhost:5173/auth?token=${token}`;
            // ================= EMAIL PAYLOAD =================
            emailPayload.push({
                email: r.contact_info?.email,
                name: r.name,
                date: iData?.date,
                time: iData?.time,
                jobtitle: step1.jobRole,
                recruiterName: recruiter.fullName,
                recruiterEmail: recruiter.email,
                recruiterCompany: recruiter.company,
                link,
            });
            console.log("user from userId" , recruiter)
            console.log("Generated Magic Link:", emailPayload);

        }
       

        // ================= SEND EMAILS =================
        await sendInterviewEmails(emailPayload);

        await t.commit();

        res.json({ message: "Hiring data saved successfully" });

    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ error: "Failed to save data" });
    }
};