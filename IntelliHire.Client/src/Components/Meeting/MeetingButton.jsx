import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { webrtcStore } from "../../store/webRtcStore";
import { useSession } from "./sessionContext";
import { v4 as uuidv4 } from "uuid";

const MeetingButton = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setWebRtcSessionId } = useSession();

  const joinMeeting = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      console.log("[JOIN] Media stream acquired");

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Add local tracks (mic + camera)
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 🔴 Receive remote audio (TTS)
      pc.addTransceiver("audio", { direction: "recvonly" });

      const sessionId = uuidv4();
      const ws = new WebSocket(
        `ws://localhost:8001/api/webrtc/ws/${sessionId}`
      );

      ws.onopen = async () => {
        ws.send(JSON.stringify({ type: "auth", token }));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        ws.send(JSON.stringify({
          type: "offer",
          sdp: offer.sdp,
        }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "ice",
            candidate: event.candidate,
          }));
        }
      };

      ws.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);

        if (data.type === "answer") {
          await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });

          console.log("✅ WebRTC Connected");

          webrtcStore.pc = pc;
          webrtcStore.ws = ws;
          webrtcStore.stream = stream;

          setWebRtcSessionId(sessionId);
          navigate("/Meet");
        }

        if (data.type === "ice") {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err) {
            console.warn("ICE error", err);
          }
        }
      };
    } catch (err) {
      console.error("Join failed:", err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={joinMeeting}
      disabled={loading}
      className="rounded-3xl w-[180px] py-5 font-semibold mt-20
      text-[#F2FAF5]
      bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]"
    >
      {loading ? "Connecting..." : "Join Now"}
    </button>
  );
};

export default MeetingButton;