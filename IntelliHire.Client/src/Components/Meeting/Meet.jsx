import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
import { webrtcStore } from "../../store/webRtcStore";
import { useSession } from "./sessionContext";

export default function Meet() {
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const pc = webrtcStore.pc;
  const ws = webrtcStore.ws;
  const stream = webrtcStore.stream;
  const remoteAudioStream = webrtcStore.remoteAudioStream;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interviewSessionId, setInterviewSessionId] = useState();
  const [audioStatus, setAudioStatus] = useState("⏳ Initializing...");

  const interviewSessionIdRef = useRef();

  useEffect(() => {
    interviewSessionIdRef.current = interviewSessionId;
  }, [interviewSessionId]);

  // ---------- SETUP REMOTE AUDIO ----------
  useEffect(() => {
    if (!remoteAudioRef.current) return;

    console.log("\n" + "=".repeat(70));
    console.log("🎵 MEET: SETTING UP REMOTE AUDIO");
    console.log("=".repeat(70));

    // If we have the remote stream from MeetingButton, use it
    if (remoteAudioStream) {
      console.log("✅ Remote audio stream available from MeetingButton");
      console.log("  Stream ID:", remoteAudioStream.id);
      console.log("  Audio tracks:", remoteAudioStream.getAudioTracks().length);

      remoteAudioRef.current.srcObject = remoteAudioStream;
      setAudioStatus("✅ Stream connected (from MeetingButton)");

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

          // Retry
          console.log("🔄 Retrying...");
          setTimeout(() => {
            remoteAudioRef.current?.play().catch((e) => {
              console.error("❌ Retry failed:", e.message);
            });
          }, 1000);
        });
    } else {
      console.log("⚠️ No remote audio stream in webrtcStore");
      console.log("Setting up ontrack handler as fallback...");
      setAudioStatus("⏳ Waiting for audio track...");

      // Fallback: attach ontrack handler in Meet if not set up in MeetingButton
      if (pc) {
        pc.ontrack = (event) => {
          console.log("\n🎉 pc.ontrack fired (fallback handler)");
          console.log("Track:", {
            kind: event.track.kind,
            enabled: event.track.enabled,
            streams: event.streams.length,
          });

          if (event.track.kind === "audio" && event.streams.length > 0) {
            const audioStream = event.streams[0];
            console.log("✅ Audio stream:", audioStream.id);

            remoteAudioRef.current.srcObject = audioStream;
            setAudioStatus("✅ Stream connected (from pc.ontrack)");

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

    // Setup audio element event listeners
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
  }, [remoteAudioStream, pc]);

  // ---------- LOCAL VIDEO ----------
  useEffect(() => {
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ---------- START INTERVIEW ----------
  const startInterview = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch("http://localhost:8000/api/flow/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateId: "test123",
          jobId: "job123",
        }),
      });

      const data = (await res.json()).data;

      interviewSessionIdRef.current = data.sessionId;
      setInterviewSessionId(data.sessionId);

      setQuestion(data.question);
      sendQuestionToBackend(data.question);
    } catch (err) {
      console.error("Start interview error:", err);
    }
  };

  // ---------- SEND QUESTION ----------
  const sendQuestionToBackend = (text) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "question", text }));
      console.log("📨 Sent question:", text);
    }

    setTimeout(() => listenToAnswer(), 500);
  };

  // ---------- LISTEN ----------
  const listenToAnswer = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    setIsListening(true);

    const previousOnMessage = ws.onmessage;

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      const data = JSON.parse(event.data);

      if (data.type === "transcript") {
        ws.onmessage = previousOnMessage;
        setIsListening(false);
        submitAnswer(data.text);
      }

      if (data.type === "question") {
        setQuestion(data.text);
      }
    };
  };

  // ---------- SUBMIT ANSWER ----------
  const submitAnswer = async (answer) => {
    try {

      const token = localStorage.getItem("accessToken");

      const res = await fetch("http://localhost:8000/api/flow/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answer,
          sessionId: interviewSessionIdRef.current,
        }),
      });

      const data = await res.json();

      setQuestion(data.question);
      sendQuestionToBackend(data.question);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- INIT ----------
  useEffect(() => {
    if (!pc || !stream) {
      navigate("/");
    } else {
      console.log("✅ Meet component mounted");
      startInterview();
    }
  }, []);

  // ---------- CONTROLS ----------
  const toggleMute = () => {
    const track = stream?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleVideo = () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  };

  const endCall = () => {
    stream?.getTracks().forEach((t) => t.stop());
    pc?.close();
    ws?.close();

    webrtcStore.pc = null;
    webrtcStore.ws = null;
    webrtcStore.stream = null;
    webrtcStore.remoteAudioStream = null;

    navigate("/");
  };

  const manualPlay = () => {
    console.log("▶️ Manual play clicked");
    remoteAudioRef.current?.play().catch((err) => {
      console.error("❌ Play failed:", err);
    });
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

        <div className="bg-white p-4 rounded-xl mt-4 text-lg font-semibold">
          {question || "Interview starting..."}
        </div>

        {isListening && (
          <div className="bg-yellow-100 p-2 rounded-lg mt-2 text-center font-semibold">
            Listening to your answer...
          </div>
        )}

        {/* AUDIO STATUS */}
        <div className="bg-blue-100 border-2 border-blue-500 p-3 rounded-lg mt-3 text-center font-bold text-blue-900 text-lg">
          {audioStatus}
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <button
            onClick={toggleMute}
            className="p-4 bg-white rounded-xl hover:bg-gray-100 transition"
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>

          <button
            onClick={toggleVideo}
            className="p-4 bg-white rounded-xl hover:bg-gray-100 transition"
          >
            {isVideoOff ? <VideoOff /> : <Video />}
          </button>

          <button
            onClick={endCall}
            className="p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
          >
            <Phone />
          </button>
        </div>

        {/* DEBUG BUTTONS */}
        {/* <button
          onClick={manualPlay}
          className="mt-4 w-full bg-blue-500 text-white p-3 rounded-xl font-semibold hover:bg-blue-600 transition"
        >
          ▶️ Manual Play Audio
        </button> */}
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