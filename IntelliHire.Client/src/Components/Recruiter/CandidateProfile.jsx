import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCandidateProfile } from "../../api/resume_api";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import { motion } from "framer-motion";

import {
    Mail,
    Phone,
    Github,
    Linkedin,
    Sparkles,
    Briefcase,
    GraduationCap,
    Code2,
    Link as LinkIcon,
    CheckCircle,
    Rocket,
    Calendar,
} from "lucide-react";

const CandidateProfile = () => {
    const { resumeId } = useParams();
    const [profile, setProfile] = useState(null);
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [resumeId]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";

        const date = new Date(dateStr);

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    const formatTime = (timeStr) => {
        if (!timeStr) return "";

        // assumes "14:30:00" or "14:30"
        const [hours, minutes] = timeStr.split(":");

        let h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";

        h = h % 12;
        if (h === 0) h = 12;

        return `${h}:${minutes} ${ampm}`;
    };
    useEffect(() => {
        const fetchData = async () => {
            const data = await getCandidateProfile(resumeId);
            setProfile(data);
            console.log(data)
        };
        fetchData();
    }, [resumeId]);

    if (!profile) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#D1DED3]">
                Loading...
            </div>
        );
    }
    const normalizeSkills = (skills) => {
    if (!skills) return [];

    // Case 1: already array
    if (Array.isArray(skills)) {
        return skills.flatMap(item => {
            // if nested arrays
            if (Array.isArray(item)) return item;

            // if object accidentally inside array
            if (typeof item === "object") return Object.values(item).flat();

            return item;
        });
    }

    // Case 2: object format
    if (typeof skills === "object") {
        return Object.values(skills).flat();
    }

    // Case 3: string format
    if (typeof skills === "string") {
        return skills.split(",").map(s => s.trim()).filter(Boolean);
    }

    return [];
};

    return (
        <div className="flex min-h-screen bg-[#D1DED3]">

            {/* SIDEBAR */}
            <div className="w-64">
                <SidebarCustom />
            </div>

            {/* MAIN */}
            <div className="flex-1 px-10 py-8 space-y-10">

                {/* HEADER */}
                <div className="pb-6 border-b border-[#9CBFAC]">
                    <h1 className="text-4xl font-bold text-[#29445D]">
                        {profile.name}
                    </h1>

                    <div className="flex flex-wrap gap-6 mt-3 text-md font-semibold text-[#29445D]">

                        <span className="flex items-center gap-2">
                            <Mail size={16} /> {profile.email}
                        </span>

                        <span className="flex items-center gap-2">
                            <Phone size={16} /> {profile.phone}
                        </span>

                        {profile.github_link && (
                            <a
                                href={profile.github_link}
                                target="_blank"
                                className="flex items-center gap-2 hover:text-[#29445D]"
                            >
                                <Github size={16} /> GitHub
                            </a>
                        )}

                        {profile.linkedin && (
                            <a
                                href={profile.linkedin}
                                target="_blank"
                                className="flex items-center gap-2 hover:text-[#29445D]"
                            >
                                <Linkedin size={16} /> LinkedIn
                            </a>
                        )}

                    </div>
                </div>

                {/* GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT SIDE */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* SKILLS */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#29445D] flex items-center gap-2 mb-4">
                                <Sparkles size={18} /> Skills Overview
                            </h2>

                            <div className="flex flex-wrap gap-2">
                               {normalizeSkills(profile.skills_summary).map((s, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-[#9CBFAC] text-[#29445D] rounded-full text-sm"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* EXPERIENCE */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#29445D] flex items-center gap-2 mb-6">
                                <Briefcase size={30} /> Experience
                            </h2>

                            <div className="space-y-8 border-l-2 border-[#9CBFAC] pl-6">

                                {profile.Experiences?.map((e, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.7, delay: i * 0.1 }}
                                        className="relative"
                                    >
                                        <div className="absolute -left-[34px] top-2 w-3 h-3 bg-[#29445D] rounded-full" />

                                        <h3 className="text-xl font-semibold text-[#29445D]">
                                            {e.title}
                                        </h3>

                                        <p className="text-md font-semibold text-[#45767C]">
                                            {e.organization}
                                        </p>

                                        <p className="text-md text-gray-600 mt-1">
                                            {e.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* EDUCATION (FIXED) */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#29445D] flex items-center gap-2 mb-4">
                                <GraduationCap size={18} /> Education
                            </h2>

                            <div className="space-y-5">

                                {profile.Qualifications?.map((q, i) => (
                                    <div key={i} className="border-l-2 border-[#9CBFAC] pl-4">
                                        <h3 className="font-semibold text-[#29445D]">
                                            {q.degree_name}
                                        </h3>

                                        <p className="text-md font-semibold text-gray-600">
                                            {q.institute}
                                        </p>

                                        {q.start_date && (<p className="text-xs text-[#45767C]">
                                            {q.start_date} — {q.end_date}
                                        </p>)}

                                        {q.grade && (
                                            <p className="text-xs text-[#45767C]">
                                                Grade: {q.grade}
                                            </p>
                                        )}
                                    </div>
                                ))}

                            </div>
                        </section>

                        {/* PROJECTS (NO CARDS — CLEAN LIST STYLE + FIXED LINKS) */}
                        {/* PROJECTS */}
                        <section>
                            <h2 className="text-2xl lg:text-3xl font-bold text-[#29445D] flex items-center gap-2 mb-6">
                                <Code2 size={20} /> Projects
                            </h2>

                            <div className="relative border-l-2 border-[#9CBFAC] pl-6 space-y-10">

                                {profile.Projects?.map((p, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -35 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, amount: 0.3 }}
                                        transition={{ duration: 0.85, ease: "easeOut", delay: i * 0.1 }}
                                        className="relative"
                                    >

                                        {/* DOT (same as experience feel) */}
                                        <div className="absolute -left-[34px] top-2 w-3 h-3 bg-[#29445D] rounded-full" />

                                        {/* TITLE + LINK */}
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl lg:text-xl font-semibold text-[#29445D]">
                                                {p.name}
                                            </h3>

                                            {/* FIXED GITHUB / SOURCE LINK */}
                                            {p.link && (
                                                <a
                                                    href={p.link}
                                                    target="_blank"
                                                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#719D99] border border-[#9CBFAC] text-sm text-white hover:border-[#29445D] transition"
                                                >
                                                    <p size={14} />
                                                    Source
                                                </a>
                                            )}
                                        </div>

                                        {/* DESCRIPTION */}
                                        <p className="text-md text-gray-600 mt-1 leading-relaxed">
                                            {p.description}
                                        </p>

                                        {/* TECH STACK (FIXED → SHOW ALL, NOT LIMITED) */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {(Array.isArray(p.tech_stack)
                                                ? p.tech_stack
                                                : typeof p.tech_stack === "string"
                                                    ? JSON.parse(p.tech_stack.replace(/""/g, '"'))
                                                    : []
                                            ).map((t, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-md lg:text-sm px-2 py-1 bg-[#719D99] text-white rounded"
                                                >
                                                    {t}
                                                </span>
                                            ))}
                                        </div>

                                    </motion.div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* RIGHT SIDE */}
                    <div className="space-y-6">

                        {/* INTERVIEW STATUS CARD */}
                        <motion.div
                            initial={{ opacity: 0, x: 30, scale: 0.95 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#F2FAF5] border border-[#9CBFAC] rounded-xl p-6 shadow-sm"
                        >

                            <h3 className="text-xl font-bold text-[#29445D] mb-4 flex items-center gap-2">
                                <Calendar size={18} /> Interview Status
                            </h3>

                            <div className="space-y-4 text-sm">

                                <div className="flex items-center justify-between">
                                    <span className="text-[#45767C]">Role</span>
                                    <span className="text-[#29445D] font-medium">
                                        {profile?.job_role || "Not Assigned"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[#45767C]">Status</span>
                                    <span className={`font-semibold ${profile?.interview_status === "Completed"
                                            ? "text-green-600"
                                            : profile?.interview_status === "Scheduled"
                                                ? "text-[#45767C]"
                                                : "text-orange-500"
                                        }`}>
                                        {profile?.interview_status || "Completed"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[#45767C]">Schedule</span>
                                    <span className="text-[#29445D]">
                                        {profile?.interview_date
                                            ? `${formatDate(profile.interview_date)}`
                                            : "Not Scheduled"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[#45767C]">Time</span>
                                    <span className="text-[#29445D]">
                                        {profile?.interview_time
                                            ? formatTime(profile.interview_time)
                                            : "Not Scheduled"}
                                    </span>
                                </div>

                            </div>
                        </motion.div>

                        {/* OVERVIEW CARD */}
                        <motion.div
                            initial={{ opacity: 0, x: 30, scale: 0.95 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#F2FAF5] border border-[#9CBFAC] rounded-xl p-6 shadow-sm"
                        >

                            <h3 className="text-xl font-bold text-[#29445D] mb-4">
                                Overview
                            </h3>

                            <div className="space-y-3 text-sm text-[#29445D]">

                                <div className="flex justify-between">
                                    <span>Skills</span>
                                    <span>{profile.skills_summary?.length || 0}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Experience</span>
                                    <span>
                                        {profile.Experiences?.reduce(
                                            (s, e) => s + parseFloat(e.years || 0),
                                            0
                                        ) || 0}
                                        +
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Education</span>
                                    <span>{profile.Qualifications?.length || 0}</span>
                                </div>

                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateProfile;