import React, { useState, useEffect } from "react";
import { motion as Motion } from "motion/react"; // import motion
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, Users, Settings, Phone, Maximize, Volume2, VolumeX, MoreVertical, FileText, Sparkles, Clock, CheckCircle } from "lucide-react";
import logo from "../../assets/landing/logo_final.png";

export default function Meet() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  return (
    <div className="h-screen bg-[#D1DED3] flex flex-col">

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video Grid */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
            
            {/* Your Video */}
            <Motion.div
              className="relative bg-[#45767C] rounded-xl overflow-hidden group"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {isVideoOff ? (
                  <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center">
                    <VideoOff className="w-12 h-12 text-gray-400" />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-[#9CBFAC] rounded-full flex items-center justify-center">
                    <span className="text-[#29445D] text-4xl font-bold">NF</span>
                  </div>
                )}
              </div>
            </Motion.div>

            {/* Candidate Video */}
            <Motion.div
              className="relative bg-[#45767C] rounded-xl overflow-hidden group"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-[#9CBFAC] rounded-full flex items-center justify-center">
                  <span className="text-[#29445D] text-4xl font-bold">IH</span>
                </div>
              </div>
            </Motion.div>

          </div>

          {/* Controls Bar */}
          <Motion.div
            className="bg-[#45767C] rounded-xl p-4 flex items-center justify-between"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Left Controls */}
            <div className="flex items-center space-x-2">
              <Motion.button
                onClick={() => setIsMuted(!isMuted)}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-xl transition ${isMuted ? 'bg-[#29445D]' : 'bg-[#D1DED3]'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-[#D1DED3]" /> : <Mic className="w-5 h-5 text-[#29445D]" />}
              </Motion.button>
              <Motion.button
                onClick={() => setIsVideoOff(!isVideoOff)}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-xl transition ${isVideoOff ? 'bg-[#29445D]' : 'bg-[#D1DED3]'}`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5 text-[#D1DED3]" /> : <Video className="w-5 h-5 text-[#29445D]" />}
              </Motion.button>
            </div>

            {/* End Button */}
            <Motion.button
              className="px-6 py-4 bg-[#29445D] hover:bg-[#719D99] rounded-xl transition flex items-center space-x-2"
              whileHover={{ scale: 1.03, boxShadow: "0px 8px 20px rgba(0,0,0,0.2)" }}
            >
              <Phone className="w-5 h-5 text-[#D1DED3]" />
              <span className="text-[#D1DED3] font-semibold">End Interview</span>
            </Motion.button>
          </Motion.div>

        </div>
      </div>
    </div>
  );
}
