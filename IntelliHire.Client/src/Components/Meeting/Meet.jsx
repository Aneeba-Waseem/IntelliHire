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

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interviewSessionId, setInterviewSessionId] = useState();

  const interviewSessionIdRef = useRef();

  useEffect(() => {
    interviewSessionIdRef.current = interviewSessionId;
  }, [interviewSessionId]);

  // ---------- HANDLE REMOTE AUDIO TRACK ----------
  useEffect(() => {
    if (!pc || !remoteAudioRef.current) return;

    const remoteStream = new MediaStream();
    remoteAudioRef.current.srcObject = remoteStream;

    pc.ontrack = (event) => {
      if (event.track.kind === "audio") {
        console.log("🎧 Remote audio track received");
        remoteStream.addTrack(event.track);
        remoteAudioRef.current.play().catch(() => {
          console.warn("Autoplay blocked, click 'Enable Audio' button");
        });
      }
    };
  }, [pc]);

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
          interviewSessionId: interviewSessionIdRef.current,
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

    navigate("/");
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
          <div className="bg-yellow-100 p-2 rounded-lg mt-2 text-center">
            Listening to your answer...
          </div>
        )}

        <div className="flex justify-center gap-6 mt-4">
          <button onClick={toggleMute} className="p-4 bg-white rounded-xl">
            {isMuted ? <MicOff /> : <Mic />}
          </button>

          <button onClick={toggleVideo} className="p-4 bg-white rounded-xl">
            {isVideoOff ? <VideoOff /> : <Video />}
          </button>

          <button
            onClick={endCall}
            className="p-4 bg-red-500 text-white rounded-xl"
          >
            <Phone />
          </button>
        </div>

        <button
          onClick={() => remoteAudioRef.current?.play()}
          className="mt-4 bg-blue-500 text-white p-2 rounded"
        >
          Enable Audio
        </button>
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
}