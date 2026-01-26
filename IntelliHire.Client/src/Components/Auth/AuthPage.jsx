import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignupForm";
import logo from "../../assets/landing/logo_final.png";
import bg3 from "../../assets/backgrounds/bg_login.png";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

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


    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Branding Panel */}
            <motion.div
                className="hidden lg:flex lg:w-[50%] p-12 flex-col justify-center items-center relative overflow-hidden bg-[#F2FAF5]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Breathe Logo Animation */}
                <motion.img
                    src={logo}
                    alt="IntelliHire"
                    className="w-72 mb-8 z-10"
                    initial={{ opacity: 0, y: 50 }}   // start 50px below and invisible
                    animate={{ opacity: 1, y: 0 }}    // slide up to original position and fade in
                    transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }} // smooth cubic-bezier
                />

                <TypeAnimation
                    sequence={[
                        "Hire Smarter.", 2000,
                        "Hire Faster.", 2000,
                        "Hire Intelligently.", 1500,
                    ]}
                    speed={20}
                    repeat={Infinity}
                    className="text-[#29445D] text-4xl lg:text-5xl font-bold text-center mb-4 z-10"
                    style={{ fontFamily: 'Oswald, monospace' }}
                />

                {/* <TypewriterText /> */}

                {/* Description */}
                <motion.p
                    variants={textVariants}
                    className="text-[#45767C] text-lg lg:text-xl text-center max-w-[420px] leading-relaxed z-10"
                >
                    Empower your recruitment process with{" "}
                    <span className="text-[#719D99] font-semibold">IntelliHire</span> — your intelligent AI assistant that screens candidates, analyzes skills, and finds the perfect fit.
                    <br />
                    <span className="text-[#9CBFAC] font-medium">
                        Let data-driven insights guide your hiring journey.
                    </span>
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
                            {isLogin ? "Welcome Back" : "Get Started"}
                        </motion.h2>

                        <motion.p
                            className="text-[#29445D]"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            {isLogin
                                ? "Sign in to your recruiter account"
                                : "Create your recruiter account"}
                        </motion.p>
                    </div>

                    {isLogin ? <LoginForm /> : <SignUpForm />}

                    <motion.div
                        className="mt-1 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
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
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
