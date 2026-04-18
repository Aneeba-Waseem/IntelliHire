import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignupForm";
import logo from "../../assets/landing/logo_final.png";
import bg3 from "../../assets/backgrounds/bg_login.png";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pointer } from "lucide-react";
import { UserCheck, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, setAccessToken } from "../../features/auth/authSlice";

// inside component

const API = axios.create({
    baseURL: "http://localhost:8000"
});
<TypeAnimation
    sequence={[
        "Hire Smarter.", 1200,
        "Hire Faster.", 1200,
        "Hire Intelligently.", 1500,
    ]}
    speed={70}
    repeat={Infinity}
    className="text-[#29445D] text-4xl lg:text-5xl font-bold text-center mb-4 z-10"
/>


export default function AuthPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isLogin, setIsLogin] = useState(true);

    const containerVariants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.12 },
        },
    };

    const textVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
        },
    };

    const floatingVariants = {
        animate: {
            y: [0, -10, 0],
            x: [0, 5, -5, 0],
            transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
        },
    };
    // ✨ New "breathe" animation for logo
    const logoVariants = {
        animate: {
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
            transition: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
            },
        },
    };

    const [params] = useSearchParams();
    const token = params.get("token");

    const [candidate, setCandidate] = useState(null);
    const [isMagicMode, setIsMagicMode] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    useEffect(() => {
        if (token) {
            setIsMagicMode(true);

            API.get(`/api/auth/magic-user`, {
                params: { token }
            })
                .then(res => {
                    setCandidate(res.data);
                    console.log("Candidate:", res.data);
                })
                .catch(err => {
                    console.error(err);
                    alert("Invalid or expired link");
                });
        }
    }, [token]);
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Branding Panel */}
            <motion.div
                className="hidden lg:flex lg:w-[50%] p-12 flex-col justify-center items-center relative overflow-hidden bg-[#F2FAF5]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Logo */}
                <motion.img
                    src={logo}
                    alt="IntelliHire"
                    className="w-72 mb-8 z-10"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                />

                {/* TYPEWRITER (shared but dynamic text) */}
                {!isMagicMode && (
                    <TypeAnimation
                        sequence={
                            isMagicMode
                                ? [
                                    "Your Interview Awaits.", 2000,
                                    "Show Your Skills.", 2000,
                                    "Be Confident.", 2000,
                                ]
                                : [
                                    "Hire Smarter.", 2000,
                                    "Hire Faster.", 2000,
                                    "Hire Intelligently.", 2000,
                                ]
                        }
                        speed={40}
                        repeat={Infinity}
                        className="text-[#29445D] text-4xl lg:text-5xl font-bold text-center mb-4 z-10"
                        style={{ fontFamily: "Oswald, monospace" }}
                    />)}

                {/* DESCRIPTION (ROLE BASED) */}
                <motion.p
                    variants={textVariants}
                    className="text-[#45767C] text-lg lg:text-xl text-center max-w-[420px] leading-relaxed z-10"
                >
                    {isMagicMode ? (
                        <>
                            You’ve been invited to an AI-powered interview session.
                            This experience is designed to evaluate your skills fairly,
                            intelligently, and without bias.
                            <br />
                            <span className="text-[#29445D] font-medium">
                                Take a deep breath and perform at your best.
                            </span>
                        </>
                    ) : (
                        <>
                            Empower your recruitment process with{" "}
                            <span className="text-[#719D99] font-semibold">IntelliHire</span>{" "}
                            — your intelligent AI assistant that screens candidates, analyzes
                            skills, and finds the perfect fit.
                            <br />
                            <span className="text-[#9CBFAC] font-medium">
                                Let data-driven insights guide your hiring journey.
                            </span>
                        </>
                    )}
                </motion.p>
            </motion.div>

            {/* Right Auth Panel */}
            <div
                className="w-full lg:w-[50%] min-h-screen flex flex-col bg-[#D1DED3] justify-center p-4 sm:p-12"
                style={{
                    backgroundImage: `url(${bg3})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <motion.div
                    className="w-full max-w-md mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="text-center mb-8">
                        <motion.h2
                            key={isLogin ? "login" : "signup"} // triggers re-animation on toggle
                            initial={{ opacity: 0, x: -50 }}    // start from the left
                            animate={{ opacity: 1, x: 0 }}      // slide in
                            exit={{ opacity: 0, x: 50 }}        // optional (if you use AnimatePresence)
                            transition={{
                                duration: 0.6,
                                ease: [0.25, 0.46, 0.45, 0.94],   // smooth cubic-bezier easing
                            }}
                            className="text-5xl font-bold text-[#29445D] mb-1"
                            style={{ fontFamily: 'Oswald, monospace' }}
                        >
                            {isMagicMode
                                ? `Welcome, ${candidate?.fullName || "Candidate"}!`
                                : isLogin
                                    ? "Welcome Back"
                                    : "Get Started"}
                        </motion.h2>

                        <motion.p
                            className="text-[#29445D]"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            {isMagicMode
                                ? "Your AI interview session is ready. Please confirm your identity to continue."
                                : isLogin
                                    ? "Sign in to your recruiter account"
                                    : "Create your recruiter account"}
                        </motion.p>
                    </div>

                    {isMagicMode ? (
                        <div className="p-2 rounded-2xl">
                            <h3 className="text-xl font-semibold mb-6 text-[#29445D]">
                                Interview Access
                            </h3>

                            <div className="space-y-4">
                                <input
                                    value={candidate?.fullName || ""}
                                    disabled
                                    className=" w-full 
                                    pl-11 pr-4 py-3 
                                    border border-[#45767C] 
                                    rounded-lg 
                                    bg-[#D1DED3]
                                    text-gray-500
                                    transition-all duration-300 
                                    outline-none
                                    hover:border-[#45767C] 
                                    
                                    hover:shadow-[#9CBFAC]/50
                                    focus:ring-2 focus:ring-[#719D99] 
                                    focus:border-transparent"
                                />

                                <input
                                    value={candidate?.email || ""}
                                    disabled
                                    className=" w-full 
                                    pl-11 pr-4 py-3 
                                    border border-[#45767C] 
                                    rounded-lg 
                                    bg-[#D1DED3]
                                    text-gray-500
                                    transition-all duration-300 
                                    outline-none
                                    hover:border-[#45767C] 
                                    hover:shadow-[#9CBFAC]/50
                                    focus:ring-2 focus:ring-[#719D99] 
                                    focus:border-transparent"
                                />
                                <div className="space-y-4">

                                    {/* CONFIRMATION CARD */}
                                    <div className="flex items-start gap-3 p-4 rounded-xl border border-[#29445D]/20 bg-[#F2FAF5] hover:shadow-md transition">

                                        <input
                                            type="checkbox"
                                            checked={isConfirmed}
                                            onChange={() => setIsConfirmed(!isConfirmed)}
                                            className="mt-1 w-4 h-4 accent-[#29445D]"
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {/* <UserCheck size={16} className="text-[#29445D]" /> */}
                                                <p className="text-sm font-semibold text-[#29445D]">
                                                    Identity Verification
                                                </p>
                                            </div>

                                            <p className="text-sm text-[#29445D]/80 leading-relaxed">
                                                I confirm that I am{" "}
                                                <span className="font-semibold text-[#29445D]">
                                                    {candidate?.fullName}
                                                </span>{" "}
                                                and I am authorized to access this interview session.
                                            </p>
                                        </div>
                                    </div>

                                    {/* SECURITY NOTICE */}
                                    <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#D1DED3]/40 border border-[#29445D]/10">
                                        <Lock size={20} className="text-[#29445D] font-semibold" />

                                        <p className="text-xs text-[#29445D]/80 text-center leading-relaxed">
                                            It is secure one-time session. Once started, this interview link will be locked for security purposes.
                                        </p>
                                    </div>

                                </div>
                                <button
                                    disabled={!isConfirmed}

                                    onClick={async () => {
                                        const res = await API.post("/api/auth/magic-login", { token });

                                        const { accessToken, user } = res.data;

                                        // ✅ SAME AS RECRUITER FLOW
                                        localStorage.setItem("accessToken", accessToken);
                                        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

                                        // ✅ IMPORTANT (THIS WAS MISSING)
                                        dispatch(setUser(user));
                                        dispatch(setAccessToken(accessToken));

                                        navigate("/meetingSection");
                                    }}
                                    className={`w-full py-3 rounded-lg font-medium transition
                                        ${isConfirmed
                                            ? "bg-[#29445D] hover:bg-[#1f3448] text-white"
                                            : "bg-[#29445D] text-gray-500 cursor-not-allowed"
                                        }`}
                                >
                                    Continue to Interview
                                </button>
                            </div>
                        </div>
                    ) : (
                        isLogin ? <LoginForm /> : <SignUpForm />
                    )}

                    <motion.div
                        className="mt-1 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        {!isMagicMode && (
                            <p className="text-[#29445D]">
                                {isLogin
                                    ? "Don't have an account? "
                                    : "Already have an account? "}

                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-[#29445D] hover:text-[#29445D] font-semibold underline transition-colors duration-200"
                                >
                                    {isLogin ? "Sign Up" : "Sign In"}
                                </button>
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
