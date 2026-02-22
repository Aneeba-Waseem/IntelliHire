import React, { useState } from "react";
import { User, Building2, Mail, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../features/auth/authThunks";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function SignUpForm() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState({
    fullName: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear the error as user types
    setFormErrors({ ...formErrors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let hasError = false;
    const newErrors = { ...formErrors };

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      hasError = true;
    }

    setFormErrors(newErrors);
    if (hasError) return;

    // Dispatch registration
    const result = await dispatch(registerUser(formData));

    // Check for successful registration
    if (registerUser.fulfilled.match(result)) {
      navigate("/verify-notice");
    } else if (registerUser.rejected.match(result)) {
      // Map backend error to specific field if possible
      if (result.payload.includes("email")) {
        setFormErrors((prev) => ({ ...prev, email: result.payload }));
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
  };

  const inputBase =
    "w-full pl-11 pr-4 py-3 border border-[#29445D] rounded-lg bg-[#D1DED3] transition-all duration-300 outline-none hover:border-[#45767C] hover:bg-white hover:shadow-md hover:shadow-[#9CBFAC]/50 focus:ring-2 focus:ring-[#719D99] focus:border-transparent";

  const iconBase =
    "absolute left-3 top-1/2 -translate-y-1/2 text-[#29445D] w-5 h-5";

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Full Name */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-[#29445D] mb-2">
          Full Name
        </label>
        <div className="relative">
          <User className={iconBase} />
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            required
            className={inputBase}
          />
        </div>
        {formErrors.fullName && (
          <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
        )}
      </motion.div>

      {/* Company */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-[#29445D] mb-2">
          Company
        </label>
        <div className="relative">
          <Building2 className={iconBase} />
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Tech Corp Inc."
            required
            className={inputBase}
          />
        </div>
        {formErrors.company && (
          <p className="text-red-500 text-sm mt-1">{formErrors.company}</p>
        )}
      </motion.div>

      {/* Email */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-[#29445D] mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className={iconBase} />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="recruiter@company.com"
            required
            className={inputBase}
          />
        </div>
        {formErrors.email && (
          <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
        )}
      </motion.div>

      {/* Password */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-[#29445D] mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className={iconBase} />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            className={inputBase}
          />
        </div>
        {formErrors.password && (
          <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
        )}
      </motion.div>

      {/* Confirm Password */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-medium text-[#29445D] mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className={iconBase} />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            required
            className={inputBase}
          />
        </div>
        {formErrors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">
            {formErrors.confirmPassword}
          </p>
        )}
      </motion.div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        variants={buttonVariants}
        whileHover={{ scale: 1.03, boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="w-full text-white py-3 mt-5 rounded-lg font-semibold
          bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
          hover:from-[#45767C] hover:via-[#719D99] hover:to-[#9CBFAC]"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </motion.button>
    </motion.form>
  );
}
