import React, { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import InterviewSchedule from "./InterviewSchedule";
import InterviewRules from "./InterviewRules";
import { useNavigate } from "react-router-dom";
import { loadAuthState } from "../../features/auth/persistAuth";
import { getRemainingTimeAPI } from "../../api/interviewTimeApi";

const MeetInterface = () => {
  const [rulesChecked, setRulesChecked] = useState(false);
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [remainingTime, setRemainingTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  // "waiting" | "ready" | "expired"

  useEffect(() => {
    const fetchTime = async () => {
      const authState = loadAuthState();

      const token = authState?.accessToken;
      const candidateUserId = authState?.user?.userId;

      console.log("🔥 FRONTEND HIT");
      console.log("user ki info", authState)
      console.log("token", token)
      console.log("candidate ki id", candidateUserId)
      const data = await getRemainingTimeAPI(token, candidateUserId);


      console.log("📦 FINAL DATA:", data);

      if (!data) return;


      const { remainingMinutes, remainingSeconds } = data;

      const totalSeconds = remainingMinutes * 60 + remainingSeconds;
      if (totalSeconds > 0) {
        setRemainingTime(totalSeconds);
        setIsRunning(true);
      }
      setRemainingTime(totalSeconds > 0 ? totalSeconds : 0);
    };

    fetchTime();
  }, []);

  const endTimeRef = useRef(null);

useEffect(() => {
  if (status !== "waiting") return;

  endTimeRef.current = Date.now() + remainingTime * 1000;

  const interval = setInterval(() => {
    const diff = Math.floor((endTimeRef.current - Date.now()) / 1000);

    if (diff <= 0) {
      setRemainingTime(0);
      setStatus("ready");
      clearInterval(interval);
    } else {
      setRemainingTime(diff);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [status]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds < 0) return "0s";

    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = "";

    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
    result += `${seconds}s`;

    return result;
  };

  const handleClick = (e) => {
    console.log("handle click called");
    navigate('/meetingPermissions');
  };

  const authState = loadAuthState();
  console.log("user ki info", authState)
  const userName = authState?.user?.fullName || "User";

  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden">

      {/* Right Side */}
      <div className="w-full min-w-[80px] flex flex-col items-around justify-center">

        {/* Top Section */}
        <div className="w-full h-[40%] flex flex-col items-around justify-center">
          <Motion.h1
            className="text-3xl md:text-4xl font-semibold text-[#29445D] text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Hi {userName}, <span className="m-5 text-[#45767C]">Your Interview is Ready to Start</span>
          </Motion.h1>
        </div>

        {/* Bottom Section */}
        <div className="w-full flex flex-col items-start mt-7 justify-center px-5">

          {/* ✅ TIMER MOVED HERE (ABOVE RULES) */}
          <div className="w-full text-center mb-6">


            <p className="text-lg md:text-xl text-[#29445D]">
              Your interview will start in{" "}
              <span className="text-[#45767C] font-bold">
                {formatTime(remainingTime)}
              </span>
            </p>


            {status === "ready" && (
              <p className="text-lg md:text-xl text-green-700 font-semibold">
                You can now join the interview
              </p>
            )}

            {status === "expired" && (
              <p className="text-lg md:text-xl text-red-600 font-semibold">
                You have missed your scheduled time. Please contact HR.
              </p>
            )}

          </div>

          {/* RULES */}
          <InterviewRules />

          {/* Checkbox */}
          <div className="flex items-center gap-3 mt-6">
            <input
              type="checkbox"
              id="rulesCheck"
              checked={rulesChecked}
              onChange={() => setRulesChecked(!rulesChecked)}
              className="w-5 h-5 accent-[#45767C]"
            />
            <label htmlFor="rulesCheck" className="text-[#29445D] font-medium">
              I have read and understood the interview rules
            </label>
          </div>

          {/* Button */}
          <div className="mt-5 ml-auto mb-7 mr-8">
            <button
              disabled={!rulesChecked}
              className={`rounded-3xl w-[180px] py-5 font-semibold text-[#F2FAF5]
              bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
              hover:from-[#45767C] hover:via-[#719D99] hover:to-[#9CBFAC]
              ${!rulesChecked
                  ? "opacity-50 cursor-not-allowed"
                  : "opacity-100 cursor-pointer"
                }`}
              onClick={handleClick}
            >
              Next
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MeetInterface;