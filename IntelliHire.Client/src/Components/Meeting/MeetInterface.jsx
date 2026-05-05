import React, { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import SidebarCustom from "../CommonComponents/SidebarCustom";
import InterviewSchedule from "./InterviewSchedule";
import InterviewRules from "./InterviewRules";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadAuthState } from "../../features/auth/persistAuth";
import { getRemainingTimeAPI } from "../../api/interviewTimeApi";
import { useRef } from "react";

const MeetInterface = () => {
  const [rulesChecked, setRulesChecked] = useState(false);
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [remainingTime, setRemainingTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

const [searchParams] = useSearchParams();

// const token = searchParams.get("token");
const interviewId = searchParams.get("interviewId");
  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchTime = async () => {
      const authState = loadAuthState();

      const token = authState?.accessToken;
      const candidateUserId = authState?.user?.userId;
    
      // const token = params.get("token");
      const data = await getRemainingTimeAPI(token, candidateUserId ,interviewId);

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

  const startTimer = (seconds) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    endTimeRef.current = Date.now() + seconds * 1000;
    setRemainingTime(seconds);

    setStatus("waiting");

    intervalRef.current = setInterval(() => {
      const diff = Math.floor((endTimeRef.current - Date.now()) / 1000);

      if (diff <= 0) {
        setRemainingTime(0);
        setStatus("ready");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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

  const handleClick = () => {
    console.log("handle click called");
    // navigate('/meetingPermissions');
    navigate(`/meetingPermissions?interviewId=${interviewId}`);

  };

  const authState = loadAuthState();
  const userName = authState?.user?.fullName || "User";

  return (
    <div className="bg-[#D1DED3] w-full min-h-screen flex flex-row overflow-x-hidden overflow-y-hidden">

      <div className="w-full min-w-[80px] flex flex-col items-around justify-center">

        {/* TOP SECTION */}
        <div className="w-full flex flex-col items-center justify-center mt-10">

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

          {status === "ready" && (
            <p className="mt-6 text-lg text-[#45767C] font-medium">
              Click Next to join your interview session
            </p>
          )}

          {status === "expired" && (
            <p className="mt-6 text-lg text-red-600 font-semibold">
              Oops! You have missed your scheduled interview time.
            </p>
          )}

        </div>

        {/* RULES + BUTTON */}
        <div className="w-full flex flex-col items-start mt-7 justify-center px-5">
          <InterviewRules />

          {/* Checkbox */}
          <div className="flex items-center gap-3 mt-6">
            <input
              type="checkbox"
              id="rulesCheck"
              checked={rulesChecked}
              onChange={() => setRulesChecked(!rulesChecked)}
              className={`w-5 h-5 accent-[#45767C]  ${(status !== "ready")
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100 cursor-pointer"
                }`}
              disabled={status !== "ready"}   // optional safety

            />
            <label htmlFor="rulesCheck" className="text-[#29445D] font-medium">
              I have read and understood the interview rules
            </label>
          </div>
          <div className="mt-5 ml-auto mb-7 mr-8">
            <button
              disabled={status !== "ready" || !rulesChecked}
              className={`rounded-3xl w-[180px] py-5 font-semibold text-[#F2FAF5]
    bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
    hover:from-[#45767C] hover:via-[#719D99] hover:to-[#9CBFAC]
    ${(status !== "ready" || !rulesChecked)
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