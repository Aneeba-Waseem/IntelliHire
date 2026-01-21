import React, { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authThunks";
import { motion } from "framer-motion";

export default function LoginForm() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  // Smooth container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06, // fields appear fluidly
      },
    },
  };

  // Smooth input/button animation
  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94], // smooth easing
      },
    },
  };

  // New button variants for mount animation
  const buttonVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94], // smooth ease-out
      },
    },
  };


  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Email */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-[#29445D] mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#29445D] w-5 h-5" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="recruiter@company.com"
            required
            className="
    w-full 
    pl-11 pr-4 py-3 
    border border-[#29445D] 
    rounded-lg 
    bg-[#D1DED3]
    text-[#]
    transition-all duration-300 
    outline-none
    hover:border-[#45767C] 
    hover:bg-white
    hover:shadow-md 
    hover:shadow-[#9CBFAC]/50
    focus:ring-2 focus:ring-[#719D99] 
    focus:border-transparent
  "
          />
        </div>
      </motion.div>

      {/* Password */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-[#29445D]">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#29445D] w-5 h-5" />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className="
    w-full 
    pl-11 pr-4 py-3 
    border border-[#29445D] 
    rounded-lg 
    bg-[#D1DED3]
    text-[#]
    transition-all duration-300 
    outline-none
    hover:border-[#45767C] 
    hover:bg-white
    hover:shadow-md 
    hover:shadow-[#9CBFAC]/50
    focus:ring-2 focus:ring-[#719D99] 
    focus:border-transparent
  "
          />

        </div>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.p
          variants={itemVariants}
          className="text-red-500 text-sm"
        >
          {error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={loading}
        variants={buttonVariants} // only for mount
        whileHover={{ scale: 1.03, boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" }} // hover
        whileTap={{ scale: 0.97 }} // tap
        transition={{ type: "spring", stiffness: 200, damping: 18 }} // hover spring
        className="
        w-full text-white py-3 rounded-lg font-semibold
        bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
        hover:from-[#45767C] hover:via-[#719D99] hover:to-[#9CBFAC]
        
    "
      >
        {loading ? "Signing In..." : "Sign In"}
      </motion.button>

    </motion.form>
  );
}
