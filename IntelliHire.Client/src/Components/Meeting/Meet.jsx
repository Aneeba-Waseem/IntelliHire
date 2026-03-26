import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
import { webrtcStore } from "../../store/webRtcStore";
import { useSession } from "./sessionContext";
import { loadAuthState } from "../../features/auth/persistAuth";

/**
 * Modified Meet Component with Dual State Management
 * 
 * ⭐ KEY ARCHITECTURE:
 * 1. Use sessionContext for webRtcSessionId (persists across re-renders)
 * 2. Use webrtcStore for pc, ws, stream, remoteAudioStream (media state)
 * 3. Fallback to webrtcStore.webRtcSessionId if context is empty
 * 4. Prevents WebRTC disconnection on navigation
 */

export default function Meet() {
  const navigate = useNavigate();
  
  // ⭐ Try to get sessionId from context first
  const { webRtcSessionId: contextSessionId } = useSession();
  
  // ⭐ Fallback to store if context is empty
  const storeSessionId = webrtcStore.webRtcSessionId;
  const webRtcSessionId = contextSessionId || storeSessionId;

  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // ⭐ Get media state from webrtcStore (persists across re-renders)
  const pc = webrtcStore.pc;
  const ws = webrtcStore.ws;
  const stream = webrtcStore.stream;
  const remoteAudioStream = webrtcStore.remoteAudioStream;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [question, setQuestion] = useState("");

  // ⭐ STATE MANAGEMENT
  const [listeningState, setListeningState] = useState("idle"); // idle, listening, processing, complete
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");
  const [audioStatus, setAudioStatus] = useState("⏳ Initializing...");

  const listeningStartTimeRef = useRef(null);

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
    }
  }, [stream]);

  // ⭐ Send interview session ID to backend
  const sendInterviewSessionIdToBackend = (interviewSessionId) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "interview_session_id",
        interview_session_id: interviewSessionId,
        webrtc_session_id: webRtcSessionId, // ✅ Include WebRTC session ID
      }));
      console.log("📨 Interview session ID sent to backend:", interviewSessionId);
      console.log("    WebRTC session ID:", webRtcSessionId);
    }
  };
  const getToken = () => {
    const authState = loadAuthState();
    const accessToken = authState?.auth.accessToken;
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
          webrtcSessionId: webRtcSessionId, // ✅ Pass WebRTC session ID
        }),
      });

      const data = (await res.json()).data;

      console.log("✅ Interview started");
      console.log("   Interview Session ID:", data.sessionId);
      console.log("   WebRTC Session ID:", webRtcSessionId);
      
      // Send interview session ID to backend
      sendInterviewSessionIdToBackend(data.sessionId);
      
      setQuestion(data.question);

      // Send question via WebSocket (TTS)
      sendQuestionViaWebSocket(data.question);

      // Start listening for answer
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

  // ⭐ Start listening for answer
  const startListening = () => {
    console.log("🎤 Starting to listen for answer...");
    setListeningState("listening");
    setCurrentAnswer("");
    setAnswerFeedback("");
    listeningStartTimeRef.current = Date.now();

    // Notify backend that we're listening
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "listening_started" }));
    }

    // Setup message handler for complete transcripts
    if (ws) {
      const previousOnMessage = ws.onmessage;

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;

        try {
          const data = JSON.parse(event.data);

          // ⭐ Handle transcript_complete message (VAD detected end-of-speech)
          if (data.type === "transcript_complete") {
            console.log("✅ [COMPLETE] Transcript:", data.text);
            setCurrentAnswer(data.text);
            setAnswerFeedback("✅ Answer received - processing...");
            setListeningState("processing");
          }

          // Handle next question
          else if (data.type === "next_question") {
            console.log("📨 Next question:", data.text);
            setQuestion(data.text);
            setListeningState("idle");

            // Send TTS for new question
            sendQuestionViaWebSocket(data.text);

            // Start listening for next answer
            startListening();
          }

          // Handle interview completion
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

            // Restore previous handler
            if (previousOnMessage) ws.onmessage = previousOnMessage;
          }

          // Handle errors
          else if (data.type === "error") {
            console.error("❌ Error:", data.error);
            setAnswerFeedback(`❌ Error: ${data.error}`);
            setListeningState("idle");

            // Restore previous handler
            if (previousOnMessage) ws.onmessage = previousOnMessage;
          }

          // Handle interim transcripts (for display)
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

    // Notify backend
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "listening_stopped" }));
    }

    // Calculate listening duration
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
      startInterview();
    }
  }, [pc, stream, webRtcSessionId, navigate]);

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
  };

  const endCall = () => {
    console.log("📞 Ending call...");
    stream?.getTracks().forEach((t) => t.stop());
    pc?.close();
    ws?.close();

    webrtcStore.pc = null;
    webrtcStore.ws = null;
    webrtcStore.stream = null;
    webrtcStore.remoteAudioStream = null;
    webrtcStore.webRtcSessionId = null;

    navigate("/");
  };

  // ⭐ STATE COLOR CODING
  const getListeningStateColor = () => {
    switch (listeningState) {
      case "listening": return "bg-yellow-100 border-yellow-500 text-yellow-900";
      case "processing": return "bg-blue-100 border-blue-500 text-blue-900";
      case "complete": return "bg-green-100 border-green-500 text-green-900";
      default: return "bg-gray-100 border-gray-300 text-gray-700";
    }
  };

  const getListeningStateMessage = () => {
    switch (listeningState) {
      case "listening": return "🎤 Listening to your answer...";
      case "processing": return "⏳ Processing your answer...";
      case "complete": return "✅ Interview complete!";
      default: return "Ready for next question";
    }
  };

  return (
    <div className="h-screen bg-[#D1DED3] flex flex-col">
      <div className="flex-1 p-4 flex flex-col">
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-black rounded-xl overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          <div className="bg-[#45767C] rounded-xl flex items-center justify-center">
            <div className="w-32 h-32 bg-[#9CBFAC] rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-[#29445D]">AI</span>
            </div>
          </div>
        </div>

        {/* Display current question */}
        <div className="bg-white p-4 rounded-xl mt-4 text-lg font-semibold">
          {question || "Interview starting..."}
        </div>

        {/* Display current answer being transcribed */}
        {currentAnswer && (
          <div className="bg-green-50 border-2 border-green-300 p-3 rounded-lg mt-2 text-sm">
            <div className="font-semibold text-green-900">Your Answer:</div>
            <div className="text-green-800">{currentAnswer}</div>
          </div>
        )}

        {/* Listening state with color coding */}
        <div className={`border-2 p-3 rounded-lg mt-3 text-center font-bold text-lg ${getListeningStateColor()}`}>
          {getListeningStateMessage()}
        </div>

        {/* Answer feedback/processing status */}
        {answerFeedback && (
          <div className="bg-purple-100 border-2 border-purple-500 p-3 rounded-lg mt-2 text-center font-semibold text-purple-900 whitespace-pre-line">
            {answerFeedback}
          </div>
        )}

        {/* AUDIO STATUS */}
        <div className="bg-blue-100 border-2 border-blue-500 p-3 rounded-lg mt-3 text-center font-bold text-blue-900 text-lg">
          {audioStatus}
        </div>

        {/* Control buttons */}
        <div className="flex justify-center gap-6 mt-4">
          <button
            onClick={toggleMute}
            className="p-4 bg-white rounded-xl hover:bg-gray-100 transition"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff color="red" /> : <Mic color="green" />}
          </button>

          <button
            onClick={toggleVideo}
            className="p-4 bg-white rounded-xl hover:bg-gray-100 transition"
            title={isVideoOff ? "Turn on video" : "Turn off video"}
          >
            {isVideoOff ? <VideoOff color="red" /> : <Video color="green" />}
          </button>

          {/* Stop listening button (only shown when listening) */}
          {listeningState === "listening" && (
            <button
              onClick={stopListening}
              className="p-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition font-semibold"
              title="Stop listening (for manual submission)"
            >
              ⏹️ Stop
            </button>
          )}

          <button
            onClick={endCall}
            className="p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
            title="End interview"
          >
            <Phone />
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