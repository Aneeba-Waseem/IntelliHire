import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Phone, X } from "lucide-react";
import { webrtcStore } from "../../store/webRtcStore";
import { useSession } from "./sessionContext";
import { loadAuthState } from "../../features/auth/persistAuth";

/**
 * MERGED Meet Component
 * 
 * ⭐ KEY ARCHITECTURE:
 * 1. Code 1's minimal unified layout (best UX)
 * 2. Code 2's robust logic & logging (best reliability)
 * 3. Single teal container for main interview area
 * 4. AI avatar center-top with pulse when AI speaks
 * 5. Candidate video/initials bottom-right with recorder icon
 * 6. Live subtitles (questions) bottom-left
 * 7. Controls in separate pill container at bottom
 * 8. Web Audio API for local mic detection (VAD)
 * 9. Backend "speaking" event for question typing animation
 * 10. Context + Store fallback for session persistence
 * 11. Comprehensive logging throughout
 */

export default function Meet() {
  const navigate = useNavigate();

  // ⭐ Try to get sessionId from context first, fallback to store
  const { webRtcSessionId: contextSessionId } = useSession();
  const storeSessionId = webrtcStore.webRtcSessionId;
  const webRtcSessionId = contextSessionId || storeSessionId;

  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // ⭐ Get media state from webrtcStore (persists across re-renders)
  const pc = webrtcStore.pc;
  const ws = webrtcStore.ws;
  const stream = webrtcStore.stream;
  const remoteAudioStream = webrtcStore.remoteAudioStream;

  const [isMuted, setIsMuted] = useState(
    webrtcStore.micOn === false
  );

  const [isVideoOff, setIsVideoOff] = useState(
    webrtcStore.cameraOn === false
  );
  const [question, setQuestion] = useState("");

  // ⭐ STATE MANAGEMENT
  const [listeningState, setListeningState] = useState("idle");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");
  const [audioStatus, setAudioStatus] = useState("⏳ Initializing...");

  // ⭐ NEW STATES FOR UI ENHANCEMENTS
  const [isAISpeaking, setIsAISpeaking] = useState(false); // AI avatar pulse
  const [isUserSpeaking, setIsUserSpeaking] = useState(false); // Candidate recorder icon
  const [displayedQuestion, setDisplayedQuestion] = useState(""); // Typing animation
  const [showCameraWarning, setShowCameraWarning] = useState(false);
  const [cameraWarningTimeLeft, setCameraWarningTimeLeft] = useState(40);

  // Candidate info (hardcoded)
  const candidateName = "Fareha Ali";
  const candidateInitials = candidateName.split(" ").map(n => n[0]).join("");

  const listeningStartTimeRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const cameraWarningTimeoutRef = useRef(null);
  const cameraWarningIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const vadCheckIntervalRef = useRef(null);

  // ---------- WEB AUDIO API VAD SETUP ----------
  const setupVAD = () => {
    if (!stream || audioContextRef.current) return;

    console.log("🎙️ Setting up Web Audio API for VAD...");

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      console.log("✅ Web Audio API initialized for VAD");

      startVADMonitoring();
    } catch (err) {
      console.error("❌ Web Audio API error:", err);
    }
  };

  const startVADMonitoring = () => {
    if (!analyserRef.current || vadCheckIntervalRef.current) return;

    console.log("🎤 Starting VAD monitoring...");

    const SPEECH_THRESHOLD = 30;
    const SILENCE_DURATION = 800;

    vadCheckIntervalRef.current = setInterval(() => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

      if (average > SPEECH_THRESHOLD) {
        if (!isUserSpeaking) {
          console.log("🎤 User speech detected");
          setIsUserSpeaking(true);
        }

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      } else {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

        silenceTimeoutRef.current = setTimeout(() => {
          if (isUserSpeaking) {
            console.log("🛑 User silence detected");
            setIsUserSpeaking(false);
          }
        }, SILENCE_DURATION);
      }
    }, 100);
  };

  // ---------- TYPING ANIMATION ----------
  const startTypingAnimation = (text) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setDisplayedQuestion("");
    let index = 0;

    const typeNextCharacter = () => {
      if (index < text.length) {
        setDisplayedQuestion(text.substring(0, index + 1));
        index++;
        typingTimeoutRef.current = setTimeout(typeNextCharacter, 80);
      }
    };

    typeNextCharacter();
  };

  // ---------- CAMERA WARNING ----------
  const startCameraWarning = () => {
    setShowCameraWarning(true);
    setCameraWarningTimeLeft(40);

    if (cameraWarningTimeoutRef.current) clearTimeout(cameraWarningTimeoutRef.current);
    if (cameraWarningIntervalRef.current) clearInterval(cameraWarningIntervalRef.current);

    cameraWarningIntervalRef.current = setInterval(() => {
      setCameraWarningTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(cameraWarningIntervalRef.current);
          setShowCameraWarning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    cameraWarningTimeoutRef.current = setTimeout(() => {
      setShowCameraWarning(false);
    }, 40000);
  };

  const closeCameraWarning = () => {
    if (cameraWarningTimeoutRef.current) clearTimeout(cameraWarningTimeoutRef.current);
    if (cameraWarningIntervalRef.current) clearInterval(cameraWarningIntervalRef.current);
    setShowCameraWarning(false);
  };

  // ---------- SETUP REMOTE AUDIO ----------
  useEffect(() => {
    if (!remoteAudioRef.current) return;

    console.log("\n" + "=".repeat(70));
    console.log("🎵 MEET: SETTING UP REMOTE AUDIO");
    console.log("=".repeat(70));
    console.log("📍 WebRTC Session ID (Context):", contextSessionId);
    console.log("📍 WebRTC Session ID (Store):", storeSessionId);
    console.log("📍 Active Session ID:", webRtcSessionId);

    if (remoteAudioStream) {
      console.log("✅ Remote audio stream available");
      console.log("  Stream ID:", remoteAudioStream.id);
      console.log("  Audio tracks:", remoteAudioStream.getAudioTracks().length);

      remoteAudioRef.current.srcObject = remoteAudioStream;
      setAudioStatus("✅ Stream connected");

      console.log("▶️ Attempting to play audio...");

      remoteAudioRef.current
        .play()
        .then(() => {
          console.log("\n" + "✅".repeat(25));
          console.log("✅ AUDIO PLAYBACK STARTED ✅");
          console.log("✅".repeat(25) + "\n");
          setAudioStatus("✅✅✅ AUDIO PLAYING 🎉");
        })
        .catch((err) => {
          console.error("❌ Playback error:", err.name, err.message);
          setAudioStatus(`❌ ${err.name}: ${err.message}`);

          console.log("🔄 Retrying...");
          setTimeout(() => {
            remoteAudioRef.current?.play().catch((e) => {
              console.error("❌ Retry failed:", e.message);
            });
          }, 1000);
        });
    } else {
      console.log("⚠️ No remote audio stream yet");
      setAudioStatus("⏳ Waiting for audio track...");

      if (pc) {
        pc.ontrack = (event) => {
          console.log("\n🎉 pc.ontrack fired");

          if (event.track.kind === "audio" && event.streams.length > 0) {
            const audioStream = event.streams[0];
            console.log("✅ Audio stream:", audioStream.id);

            remoteAudioRef.current.srcObject = audioStream;
            setAudioStatus("✅ Stream connected");

            remoteAudioRef.current
              .play()
              .then(() => {
                console.log("✅ AUDIO PLAYBACK STARTED");
                setAudioStatus("✅✅✅ AUDIO PLAYING 🎉");
              })
              .catch((err) => {
                console.error("❌ Play error:", err.message);
                setAudioStatus(`❌ ${err.message}`);
              });
          }
        };
      }
    }

    const audioEl = remoteAudioRef.current;

    const handlePlay = () => {
      console.log("✅ Audio play event");
    };

    const handlePause = () => {
      console.log("⏸️ Audio pause event");
    };

    const handleCanPlay = () => {
      console.log("✅ Audio canplay event");
    };

    const handleLoadedMetadata = () => {
      console.log("✅ Audio loadedmetadata event");
    };

    const handleError = (e) => {
      console.error("❌ Audio error:", e);
    };

    audioEl.addEventListener("play", handlePlay);
    audioEl.addEventListener("pause", handlePause);
    audioEl.addEventListener("canplay", handleCanPlay);
    audioEl.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioEl.addEventListener("error", handleError);

    return () => {
      audioEl.removeEventListener("play", handlePlay);
      audioEl.removeEventListener("pause", handlePause);
      audioEl.removeEventListener("canplay", handleCanPlay);
      audioEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioEl.removeEventListener("error", handleError);
    };
  }, [remoteAudioStream, pc, webRtcSessionId, contextSessionId, storeSessionId]);

  // ---------- LOCAL VIDEO ----------
  useEffect(() => {
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => { });
      setupVAD();
    }
  }, [stream]);

  // ⭐ Send interview session ID to backend
  const sendInterviewSessionIdToBackend = (interviewSessionId) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "interview_session_id",
        interview_session_id: interviewSessionId,
        webrtc_session_id: webRtcSessionId,
      }));
      console.log("📨 Interview session ID sent to backend:", interviewSessionId);
      console.log("    WebRTC session ID:", webRtcSessionId);
    }
  };

  const getToken = () => {
    const authState = loadAuthState();
    const accessToken = authState?.accessToken;
    console.log(accessToken);
    return accessToken;
  };

  // ---------- START INTERVIEW ----------
  const startInterview = async () => {
    try {
      const token = getToken();

      const res = await fetch("http://localhost:8000/api/flow/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateId: "test123",
          jobId: "job123",
          webrtcSessionId: webRtcSessionId,
        }),
      });

      const data = (await res.json()).data;

      console.log("✅ Interview started");
      console.log("   Interview Session ID:", data.sessionId);
      console.log("   WebRTC Session ID:", webRtcSessionId);

      sendInterviewSessionIdToBackend(data.sessionId);

      setQuestion(data.question);

      sendQuestionViaWebSocket(data.question);

      startListening();
    } catch (err) {
      console.error("Start interview error:", err);
    }
  };

  // Send question via WebSocket (TTS)
  const sendQuestionViaWebSocket = (text) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "question", text }));
      console.log("📨 Sent question for TTS:", text);
    }
  };

  // Send auth via WebSocket
  const sendAuthViaWebSocket = (token) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "auth", token }));
      console.log("📨 Sent authentication request");
    }
  };

  // ⭐ Start listening for answer
  const startListening = () => {
    console.log("🎤 Starting to listen for answer...");
    setListeningState("listening");
    setCurrentAnswer("");
    setAnswerFeedback("");
    listeningStartTimeRef.current = Date.now();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "listening_started" }));
    }

    if (ws) {
      const previousOnMessage = ws.onmessage;

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;

        try {
          const data = JSON.parse(event.data);

          // ⭐ AI speaking - trigger typing animation
          if (data.type === "speaking") {
            console.log("🎙️ [BACKEND] AI speaking - starting typing animation");
            setIsAISpeaking(true);
            const questionText = data.text || question;
            if (questionText) {
              startTypingAnimation(questionText);
            }
          }

          // ⭐ AI speaking stopped
          else if (data.type === "speaking_stopped") {
            console.log("🛑 [BACKEND] AI speaking stopped");
            setIsAISpeaking(false);
          }

          // ⭐ Transcript complete
          else if (data.type === "transcript_complete") {
            console.log("✅ [COMPLETE] Transcript:", data.text);
            setCurrentAnswer(data.text);
            setAnswerFeedback("✅ Answer received - processing...");
            setListeningState("processing");
          }

          // Next question
          else if (data.type === "next_question") {
            console.log("📨 Next question:", data.text);
            setQuestion(data.text);
            setDisplayedQuestion("");
            setListeningState("idle");

            sendQuestionViaWebSocket(data.text);

            startListening();
            sendAuthViaWebSocket(getToken());
          }

          // Interview complete
          else if (data.type === "interview_complete") {
            console.log("🎉 Interview completed!");
            console.log("Report:", data.report);

            setListeningState("complete");
            setAnswerFeedback(`
🎉 Interview Complete!
Rating: ${data.report.overallRating}
Score: ${data.report.score}
Message: ${data.message}
            `);

            if (previousOnMessage) ws.onmessage = previousOnMessage;
          }

          // Error
          else if (data.type === "error") {
            console.error("❌ Error:", data.error);
            setAnswerFeedback(`❌ Error: ${data.error}`);
            setListeningState("idle");

            if (previousOnMessage) ws.onmessage = previousOnMessage;
          }

          else if (data.type === "answer_received") {
            console.log("📨 Answer received:", data.text);
            setCurrentAnswer(data.text);
          }
        } catch (err) {
          console.error("Error parsing message:", err);
        }
      };
    }
  };

  // ---------- STOP LISTENING ----------
  const stopListening = () => {
    console.log("🛑 Stopping listening...");
    setListeningState("idle");

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "listening_stopped" }));
    }

    if (listeningStartTimeRef.current) {
      const duration = (Date.now() - listeningStartTimeRef.current) / 1000;
      console.log(`Listened for ${duration.toFixed(1)}s`);
    }
  };

  // ---------- INIT ----------
  useEffect(() => {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 MEET COMPONENT INITIALIZATION");
    console.log("=".repeat(70));
    console.log("PC available:", !!pc);
    console.log("Stream available:", !!stream);
    console.log("WebSocket available:", !!ws);
    console.log("Context Session ID:", contextSessionId);
    console.log("Store Session ID:", storeSessionId);
    console.log("Active Session ID:", webRtcSessionId);

    if (!pc || !stream) {
      console.error("❌ Missing PC or Stream - redirecting");
      navigate("/");
    } else if (!webRtcSessionId) {
      console.error("❌ Missing WebRTC Session ID - redirecting");
      navigate("/");
    } else {
      console.log("✅ All checks passed - starting interview");
      // ✅ Sync track states from PreJoin
      if (stream) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });

        stream.getVideoTracks().forEach(track => {
          track.enabled = !isVideoOff;
        });
      }
      startInterview();
    }
  }, [pc, stream, webRtcSessionId, navigate]);

  // ---------- CLEANUP ----------
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (cameraWarningTimeoutRef.current) clearTimeout(cameraWarningTimeoutRef.current);
      if (cameraWarningIntervalRef.current) clearInterval(cameraWarningIntervalRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (vadCheckIntervalRef.current) clearInterval(vadCheckIntervalRef.current);

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ---------- CONTROLS ----------
  const toggleMute = () => {
    const track = stream?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
    console.log(track.enabled ? "🎤 Unmuted" : "🔇 Muted");
  };

  const toggleVideo = () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
    console.log(track.enabled ? "📹 Video On" : "📹 Video Off");

    if (track.enabled) {
      startCameraWarning();
    }
  };

  const endCall = () => {
    console.log("📞 Ending call...");
    stream?.getTracks().forEach((t) => t.stop());
    pc?.close();
    ws?.close();

    webrtcStore.stream = null;
    webrtcStore.pc = null;
    webrtcStore.ws = null;
    webrtcStore.remoteAudioStream = null;
    webrtcStore.webRtcSessionId = null;
    webrtcStore.cameraOn = null;
    webrtcStore.micOn = null;

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#D1DED3] flex flex-col items-center justify-center p-6 relative">
      {/* CAMERA WARNING BOX */}
      {showCameraWarning && (
        <div className="fixed top-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-sm shadow-lg z-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold text-yellow-900">Camera Recording</div>
              <div className="text-xs text-yellow-800 mt-2 leading-relaxed">
                Your camera is now active. This is being recorded for review purposes. Please keep it on throughout the interview.
              </div>
              <div className="text-xs text-yellow-700 mt-2 font-medium">Auto-closing in {cameraWarningTimeLeft}s</div>
            </div>
            <button
              onClick={closeCameraWarning}
              className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 transition p-1"
              title="Close warning"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN UNIFIED CONTAINER */}
      <div className="w-full max-w-5xl bg-[#A9C5C0] rounded-3xl p-12 shadow-lg flex flex-col justify-between gap-12 min-h-[600px]">

        {/* TOP: AI AVATAR - Centered */}
        <div className="flex justify-center items-center">
          <div className="relative">
            {/* Glow/pulse effect when AI speaks */}
            {isAISpeaking && (
              <>
                <div className="absolute inset-0 bg-gray-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
                <div className="absolute inset-0 bg-gray-300 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }}></div>
              </>
            )}

            {/* Main AI circle */}
            <div className={`relative w-48 h-48 bg-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg font-bold text-5xl text-[#29445D] ${isAISpeaking ? "ring-4 ring-gray-400 ring-opacity-80 scale-110" : ""
              }`}>
              AI
            </div>
          </div>
        </div>

        {/* BOTTOM: Two Columns - Subtitles Left + Candidate Right */}
        <div className="flex gap-8 items-end">

          {/* LEFT: SUBTITLES (AI Question/Live Captions) */}
          <div className="flex-1">
            <div className="text-lg font-bold text-[#29445D] leading-relaxed">
              {displayedQuestion || "Listening for question..."}
              {displayedQuestion && displayedQuestion.length < question.length && (
                <span className="animate-pulse ml-1">▌</span>
              )}
            </div>
          </div>

          {/* RIGHT: CANDIDATE INFO */}
          <div className="flex items-end gap-4">
            {/* Candidate Video/Initials Circle */}
            <div className="relative">
              <div className={`w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 transition-all duration-300 ${isUserSpeaking ? "border-gray-400 ring-4 ring-gray-300 ring-opacity-60 scale-110" : "border-white"
                }`}>
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#2d5a63] flex items-center justify-center text-white text-3xl font-bold">
                    {candidateInitials}
                  </div>
                )}
              </div>
            </div>

            {/* Recorder/Mic Indicator Icon */}
            {isUserSpeaking && (
              <div className="mb-2 animate-bounce">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-lg"
                >
                  {/* Outer circle */}
                  <circle cx="24" cy="24" r="22" fill="#A9D5D9" stroke="#45767C" strokeWidth="2" />

                  {/* Microphone icon */}
                  <circle cx="24" cy="18" r="4" fill="#45767C" />
                  <path
                    d="M24 22V28C26.2091 28 28 26.2091 28 24V22M20 22V24C20 26.2091 21.7909 28 24 28V28M24 28V32"
                    stroke="#45767C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Sound waves */}
                  <path
                    d="M18 24C18 24 17 22 17 20"
                    stroke="#45767C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="animate-pulse"
                    style={{ opacity: 0.7 }}
                  />
                  <path
                    d="M30 24C30 24 31 22 31 20"
                    stroke="#45767C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="animate-pulse"
                    style={{ opacity: 0.7, animationDelay: "0.2s" }}
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTROL BUTTONS - Separate Container Below */}
      <div className="flex gap-4 mt-8 justify-center">
        <div className="bg-[#9BB8B3] rounded-full px-2 py-2 flex gap-4 shadow-lg">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="p-4 bg-white rounded-full hover:bg-gray-100 transition shadow-md border border-gray-200"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={24} color="#d32f2f" /> : <Mic size={24} color="#4caf50" />}
          </button>

          {/* Video Button */}
          <button
            onClick={toggleVideo}
            className="p-4 bg-white rounded-full hover:bg-gray-100 transition shadow-md border border-gray-200"
            title={isVideoOff ? "Turn on video" : "Turn off video"}
          >
            {isVideoOff ? <VideoOff size={24} color="#d32f2f" /> : <Video size={24} color="#4caf50" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-md"
            title="End interview"
          >
            <Phone size={24} />
          </button>
        </div>
      </div>

      {/* AUDIO ELEMENT */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
    </div>
  );
}

