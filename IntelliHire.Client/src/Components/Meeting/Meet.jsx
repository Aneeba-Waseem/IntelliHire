import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
import { webrtcStore } from "../../store/webRtcStore";

export default function Meet() {
  const navigate = useNavigate();
  const localVideoRef = useRef(null);

  const pc = webrtcStore.pc;
  const ws = webrtcStore.ws;
  const stream = webrtcStore.stream;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  // ----------------- INTERVIEW FLOW -----------------
  const listenToAnswer = async () => {
    if (!stream) return;
    setIsListening(true);

    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return setIsListening(false);

      const audioContext = new AudioContext();
      const mediaStreamSource = audioContext.createMediaStreamSource(
        new MediaStream([audioTrack])
      );
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      mediaStreamSource.connect(processor);
      processor.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      processorRef.current = processor;

      const token = localStorage.getItem("accessToken");
      let sttWs;
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 3;

      const connectWs = () => {
        sttWs = new WebSocket(`ws://localhost:8001/api/webrtc/ws?token=${token}`);
        sttWs.onopen = () => reconnectAttempts = 0;
        sttWs.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.transcript && data.transcript.trim()) {
            stopListening();
            submitAnswer(data.transcript);
          }
        };
        sttWs.onerror = () => {
          if (reconnectAttempts < maxReconnectAttempts) {
            setTimeout(connectWs, 1000 * (reconnectAttempts + 1));
            reconnectAttempts++;
          } else stopListening();
        };
        sttWs.onclose = () => {
          if (reconnectAttempts < maxReconnectAttempts) {
            setTimeout(connectWs, 1000 * (reconnectAttempts + 1));
            reconnectAttempts++;
          } else stopListening();
        };
      };
      connectWs();

      processor.onaudioprocess = (e) => {
        const audioData = e.inputBuffer.getChannelData(0);
        const int16Data = new Int16Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          int16Data[i] = Math.max(-1, Math.min(1, audioData[i])) * 32767;
        }
        if (sttWs && sttWs.readyState === WebSocket.OPEN) {
          sttWs.send(int16Data.buffer);
        }
      };
    } catch (err) {
      console.error("Listening error:", err);
      stopListening();
    }
  };

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

  const submitAnswer = async (answer) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8000/api/flow/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      setQuestion(data.question);
      sendQuestionToBackend(data.question);
    } catch (err) {
      console.error("Submit answer error:", err);
    }
  };

  // ----------------- SEND QUESTION TO BACKEND -----------------
  const sendQuestionToBackend = (text) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "question", text }));
    }
    setTimeout(() => listenToAnswer(), 1000);
  };

  const startInterview = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const payload = { candidateId: "test123", jobId: "job123" };
      const res = await fetch("http://localhost:8000/api/flow/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setQuestion(data.question);
      sendQuestionToBackend(data.question);
    } catch (err) {
      console.error("Start interview error:", err);
    }
  };
  // ------------------------------------------------------------

  // Prevent direct navigation
  useEffect(() => {
    if (!pc || !stream) {
      navigate("/");
    } else {
      startInterview();
    }
  }, []);

  // Show local camera
  useEffect(() => {
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Receive backend messages
  useEffect(() => {
    if (!ws) return;
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === "transcript") console.log("Candidate:", data.text);
      if (data.type === "question") setQuestion(data.text);
    };
  }, [ws]);

  // Controls
  const toggleMute = () => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };
  const toggleVideo = () => {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoOff(!videoTrack.enabled);
  };
  const endCall = () => {
    stream?.getTracks().forEach((track) => track.stop());
    pc?.close();
    ws?.close();
    stopListening();
    webrtcStore.pc = null;
    webrtcStore.ws = null;
    webrtcStore.stream = null;
    navigate("/");
  };

  return (
    <div className="h-screen bg-[#D1DED3] flex flex-col">
      <div className="flex-1 p-4 flex flex-col">
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Local Camera */}
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

          {/* AI Avatar */}
          <div className="bg-[#45767C] rounded-xl flex items-center justify-center">
            <div className="w-32 h-32 bg-[#9CBFAC] rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-[#29445D]">AI</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white p-4 rounded-xl mt-4 text-lg font-semibold">
          {question || "Interview starting..."}
        </div>

        {/* Listening Status */}
        {isListening && (
          <div className="bg-yellow-100 p-2 rounded-lg mt-2 text-center">
            <p className="text-yellow-800 font-medium">Listening to your answer...</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-6 mt-4">
          <button onClick={toggleMute} className="p-4 bg-white rounded-xl">
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          <button onClick={toggleVideo} className="p-4 bg-white rounded-xl">
            {isVideoOff ? <VideoOff /> : <Video />}
          </button>
          <button onClick={endCall} className="p-4 bg-red-500 text-white rounded-xl">
            <Phone />
          </button>
        </div>
      </div>
    </div>
  );
}