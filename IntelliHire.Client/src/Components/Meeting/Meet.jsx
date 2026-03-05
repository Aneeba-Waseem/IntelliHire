import React, { useState, useEffect, useRef } from "react";
import { motion as Motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';

export default function Meet() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(location.state?.isMuted || false);
  const [isVideoOff, setIsVideoOff] = useState(location.state?.isVideoOff || false);
  const [localStream, setLocalStream] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const localVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  // Get auth token from localStorage
  const getAuthToken = () => localStorage.getItem("accessToken");

  // Start interview and get first question
  const startInterview = async () => {
    try {
      const token = getAuthToken();
          const payload = {
      candidateId: "test123",
      jobId: "job123"
    };

    console.log("[FLOW] start payload:", payload);

    const response = await fetch("http://localhost:8000/api/flow/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload)
    });

    console.log("[FLOW] status:", response.status);

    const data = await response.json();
    console.log("[FLOW] response:", data);
      setCurrentQuestion(data.question);
      speakQuestion(data.question);
    } catch (err) {
      console.error("Error starting interview:", err);
    }
  };

  // Speak question using TTS
  const speakQuestion = async (question) => {
    try {
      const token = getAuthToken();
      const response = await fetch("http://127.0.0.1:8001/api/tts/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: "test123",
          text: question
        }),
      });
      // After TTS finishes, start listening
      setTimeout(() => listenToAnswer(), 2000); // Adjust delay as needed
    } catch (err) {
      console.error("Error speaking question:", err);
    }
  };

  // Listen to candidate's answer using STT
  const listenToAnswer = async () => {
  if (!localStream) return;
  setIsListening(true);
  try {
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) {
      console.error("No audio track available");
      setIsListening(false);
      return;
    }

    const audioContext = new AudioContext();
    const mediaStreamSource = audioContext.createMediaStreamSource(
      new MediaStream([audioTrack])
    );
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    mediaStreamSource.connect(processor);
    processor.connect(audioContext.destination);

    const token = getAuthToken();
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const connectWebSocket = () => {
      ws = new WebSocket(`ws://localhost:8001/api/webrtc/ws?token=${token}`);
      ws.onopen = () => {
        console.log("Connected to WebSocket");
        reconnectAttempts = 0;
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.transcript && data.transcript.trim()) {
          stopListening();
          submitAnswer(data.transcript);
        }
      };
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(connectWebSocket, 1000 * (reconnectAttempts + 1));
          reconnectAttempts++;
        } else {
          stopListening();
        }
      };
      ws.onclose = () => {
        console.log("WebSocket closed");
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(connectWebSocket, 1000 * (reconnectAttempts + 1));
          reconnectAttempts++;
        } else {
          stopListening();
        }
      };
    };

    connectWebSocket();

    processor.onaudioprocess = (e) => {
      const audioData = e.inputBuffer.getChannelData(0);
      const int16Data = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        int16Data[i] = Math.max(-1, Math.min(1, audioData[i])) * 32767;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(int16Data.buffer);
      }
    };

  } catch (err) {
    console.error("Error listening to answer:", err);
    stopListening();
  }
};


  // Stop listening
  const stopListening = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  // Submit candidate's answer and get next question
  const submitAnswer = async (answer) => {
    try {
      const token = getAuthToken();
      const response = await fetch("http://localhost:8000/api/flow/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });
      const data = await response.json();
      setCurrentQuestion(data.question);
      speakQuestion(data.question);
    } catch (err) {
      console.error("Error submitting answer:", err);
    }
  };

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Start interview on component mount
  useEffect(() => {
    // 🔴 Start only if WebRTC told us to
    if (location.state?.startInterview) {
      console.log("[FLOW] Starting after WebRTC ready");
      startInterview();
    }

    return () => {
      stopListening();
      stopLocalStream();
    };
  }, []);

  // Start local stream
  const startLocalStream = async () => {
    try {
      const constraints = {
        video: !isVideoOff,
        audio: !isMuted,
      };
      if (!constraints.video && !constraints.audio) {
        constraints.audio = true;
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  // Stop local stream
  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  // Toggle mute
  const toggleMute = async () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsMuted(!isMuted);
      } else {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: !isVideoOff,
            audio: true,
          });
          localStream.getTracks().forEach(track => track.stop());
          setLocalStream(newStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
          }
          setIsMuted(false);
        } catch (err) {
          console.error("Error accessing audio:", err);
        }
      }
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsVideoOff(!isVideoOff);
      } else {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: !isMuted,
          });
          localStream.getTracks().forEach(track => track.stop());
          setLocalStream(newStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
          }
          setIsVideoOff(false);
        } catch (err) {
          console.error("Error accessing video:", err);
        }
      }
    }
  };

  // End call
  const endCall = () => {
    stopListening();
    stopLocalStream();
    navigate('/');
  };

  // Start stream on component mount
  useEffect(() => {
    startLocalStream();
  }, []);

  return (
    <div className="h-screen bg-[#D1DED3] flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
            {/* Your Video */}
            <Motion.div
              className="relative bg-[#45767C] rounded-xl overflow-hidden group"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                  style={{ transform: "scaleX(-1)" }}
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                  <VideoOff className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </Motion.div>

            {/* Candidate Video (placeholder) */}
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

          {/* Question Display */}
          <div className="bg-black p-4 rounded-lg mb-4">
            <p className="text-lg font-semibold text-gray-800">{currentQuestion}</p>
          </div>

          {/* Status Indicator */}
          {isListening && (
            <div className="bg-yellow-100 p-2 rounded-lg mb-4 text-center">
              <p className="text-yellow-800 font-medium">Listening to your answer...</p>
            </div>
          )}

          {/* Controls Bar */}
          <Motion.div
            className="bg-[#45767C] rounded-xl p-4 flex items-center justify-between"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex items-center space-x-2">
              <Motion.button
                onClick={toggleMute}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-xl transition ${isMuted ? 'bg-[#29445D]' : 'bg-[#D1DED3]'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-[#D1DED3]" /> : <Mic className="w-5 h-5 text-[#29445D]" />}
              </Motion.button>
              <Motion.button
                onClick={toggleVideo}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-xl transition ${isVideoOff ? 'bg-[#29445D]' : 'bg-[#D1DED3]'}`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5 text-[#D1DED3]" /> : <Video className="w-5 h-5 text-[#29445D]" />}
              </Motion.button>
            </div>

            <Motion.button
              onClick={endCall}
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
