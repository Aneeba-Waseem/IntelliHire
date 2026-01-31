import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import { motion } from "framer-motion";

const VerificationNotice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        // Call backend verify-email endpoint
        await axios.get(`http://localhost:8000/api/auth/verify-email?token=${token}`);

        setStatus("success");
        setMessage("Your email has been verified successfully! Redirecting to Dashboard...");

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/userDashboard");
        }, 2000);
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data || "Verification failed. The link may have expired."
        );
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden">
      {/* Left Sidebar (10%) */}
     

      {/* Right Side (90%) */}
      <div className="w-[100%] min-w-[80px] flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
          <motion.h1
            className={`text-2xl font-semibold mb-4 ${
              status === "success" ? "text-green-600" : "text-red-600"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {status === "loading" ? "Verifying..." : status === "success" ? "Success!" : "Error!"}
          </motion.h1>
          <p className="text-gray-700">{message}</p>
          {status === "loading" && <div className="mt-4">⏳ Please wait...</div>}
        </div>
      </div>
    </div>
  );
};

export default VerificationNotice;
