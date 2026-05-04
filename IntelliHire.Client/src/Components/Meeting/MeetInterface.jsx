import React, { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import InterviewSchedule from "./InterviewSchedule";
import InterviewRules from "./InterviewRules";
import { useNavigate } from "react-router-dom";
import { loadAuthState } from "../../features/auth/persistAuth";
import { getRemainingTimeAPI } from "../../api/interviewTimeApi";
import { useRef } from "react";

const MeetInterface = () => {
  const [rulesChecked, setRulesChecked] = useState(false);
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [remainingTime, setRemainingTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  // "waiting" | "ready" | "expired"

  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // 1. Fetch initial time
  useEffect(() => {
    const fetchTime = async () => {
      const authState = loadAuthState();

      const token = authState?.accessToken;
      const candidateUserId = authState?.user?.userId;

      const data = await getRemainingTimeAPI(token, candidateUserId);

      if (!data) return;

      const { remainingMinutes, remainingSeconds } = data;
      const totalSeconds = remainingMinutes * 60 + remainingSeconds;

      if (totalSeconds > 0) {
        setStatus("waiting");
        startTimer(totalSeconds);
      } else {
        setStatus("ready");
        setRemainingTime(0);
      }
    };

    fetchTime();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);


  // 2. Timer engine
  const startTimer = (seconds) => {
    if (intervalRef.current) clearInterval(intervalRef.current); // ADD THIS

    endTimeRef.current = Date.now() + seconds * 1000;
    setRemainingTime(seconds);

    setStatus("waiting"); // safer here too

    intervalRef.current = setInterval(() => {
      const diff = Math.floor((endTimeRef.current - Date.now()) / 1000);

      if (diff <= 0) {
        setRemainingTime(0);
        setStatus("ready");
        clearInterval(intervalRef.current);
        intervalRef.current = null; // IMPORTANT
      } else {
        setRemainingTime(diff);
      }
    }, 1000);
  };

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
        {/* TOP SECTION */}
        <div className="w-full flex flex-col items-center justify-center mt-10">

          {/* STATUS TEXT */}
          {status === "waiting" && (
            <Motion.h1
              className="text-3xl md:text-4xl font-semibold text-[#29445D] text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
             Hi {userName}! Your Interview will start soon
            </Motion.h1>
          )}

          {status === "ready" && (
            <Motion.h1
              className="text-3xl md:text-4xl font-semibold text-green-700 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
               Hi {userName}! Your Interview is Ready to Start
            </Motion.h1>
          )}

          {/* TIMER */}
          {status === "waiting" && (
            <div className="mt-6 text-center">

              <p className="text-lg text-[#29445D] mb-3">
                Starting in
              </p>

              <div className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#9CBFAC] bg-clip-text text-transparent tracking-wider">
                {formatTime(remainingTime)}
              </div>

            </div>
          )}

          {/* READY MESSAGE */}
          {status === "ready" && (
            <p className="mt-6 text-lg text-[#45767C] font-medium">
              Click Next to join your interview session
            </p>
          )}

          {/* EXPIRED */}
          {status === "expired" && (
            <p className="mt-6 text-lg text-red-600 font-semibold">
            Oops! You have missed your scheduled interview time.
            </p>
          )}

        </div>

        {/* Bottom Section */}
        <div className="w-full flex flex-col items-start mt-7 justify-center px-5">

          {/* ✅ TIMER MOVED HERE (ABOVE RULES) */}
          <div className="w-full text-center mb-6">


            {/* <p className="text-lg md:text-xl text-[#29445D]">
              Your interview will start in{" "}
              <span className="text-[#45767C] font-bold">
                {formatTime(remainingTime)}
              </span>
            </p> */}


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
{status === "ready" && (
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
)}
         
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