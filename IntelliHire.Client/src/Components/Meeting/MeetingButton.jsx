import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MeetingButton = ({ sessionId = "test123", onConnected }) => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);

  const joinMeeting = async () => {
    setLoading(true);
    try {
      // 1️⃣ Get mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[JOIN] Got mic:", stream.getTracks().map(t => t.kind));

      // 2️⃣ Create PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      pcRef.current = pc;

      // 3️⃣ Send mic to server
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.addTransceiver("audio", { direction: "sendrecv" }); // receive TTS

      // 4️⃣ Handle remote audio
      pc.ontrack = (event) => {
        if (event.track.kind === "audio") {
          const remoteStream = new MediaStream();
          remoteStream.addTrack(event.track);
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(() => console.log("Autoplay blocked"));
          }
        }
      };      

      // 6️⃣ Connect WebSocket
      const ws = new WebSocket(`ws://localhost:8001/api/webrtc/ws/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("[WS] Connected, sending offer...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
      };

      // 5️⃣ Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (
          event.candidate &&
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(JSON.stringify({
            type: "ice",
            candidate: event.candidate
          }));
        }
      };

      ws.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);

        if (data.type === "answer") {
          await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
          setConnected(true);
          if (onConnected) onConnected(pc);
          navigate("/Meet");
        }

        else if (data.type === "ice") {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (e) {
            console.warn("Error adding ICE candidate:", e);
          }
        }

        else if (data.type === "transcript") {
          console.log("STT:", data.text);
        }

        else if (data.type === "tts_status") {
          console.log("TTS streaming:", data.status);
        }
      };

      ws.onclose = () => console.log("[WS] Closed");
      ws.onerror = (e) => console.error("[WS] Error", e);

    } catch (err) {
      console.error("Join failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pcRef.current) pcRef.current.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline hidden />
      <button
        onClick={joinMeeting}
        disabled={loading || connected}
        className={`rounded-3xl w-[180px] py-5 font-semibold mt-20
        text-[#F2FAF5]
        bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
        hover:from-[#45767C] hover:via-[#719D99] hover:to-[#9CBFAC]
        ${loading || connected ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? "Connecting..." : connected ? "Connected 🎙️" : "Join Now"}
      </button>
    </>
  );
};

export default MeetingButton;