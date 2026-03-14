import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { webrtcStore } from "../../store/webRtcStore";

const MeetingButton = ({ sessionId = "test123" }) => {

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const remoteAudioRef = useRef(null);

  const joinMeeting = async () => {

    setLoading(true);

    try {

      // 1️⃣ Get mic + camera
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      console.log("[JOIN] Got media stream");

      // 2️⃣ Create PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }
        ]
      });

      // 3️⃣ Add tracks to connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.addTransceiver("audio", { direction: "sendrecv" });

      // 4️⃣ Receive AI voice
      pc.ontrack = (event) => {

        if (event.track.kind === "audio") {

          const remoteStream = new MediaStream();
          remoteStream.addTrack(event.track);

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(() => {});
          }
        }
      };

      // 5️⃣ Connect WebSocket
      const ws = new WebSocket(`ws://localhost:8001/api/webrtc/ws/${sessionId}`);

      ws.onopen = async () => {

        console.log("[WS] Connected");

        const offer = await pc.createOffer();

        await pc.setLocalDescription(offer);

        ws.send(JSON.stringify({
          type: "offer",
          sdp: offer.sdp
        }));
      };

      // 6️⃣ ICE candidates
      pc.onicecandidate = (event) => {

        if (event.candidate && ws.readyState === WebSocket.OPEN) {

          ws.send(JSON.stringify({
            type: "ice",
            candidate: event.candidate
          }));

        }
      };

      // 7️⃣ Server messages
      ws.onmessage = async (msg) => {

        const data = JSON.parse(msg.data);

        if (data.type === "answer") {

          await pc.setRemoteDescription({
            type: "answer",
            sdp: data.sdp
          });

          console.log("[WEBRTC] Connected");

          // Store globally
          webrtcStore.pc = pc;
          webrtcStore.ws = ws;
          webrtcStore.stream = stream;
          webrtcStore.sessionId = sessionId;

          // Navigate to meeting page
          navigate("/Meet");

        }

        else if (data.type === "ice") {

          try {
            await pc.addIceCandidate(data.candidate);
          }
          catch (err) {
            console.warn("ICE error", err);
          }

        }

        else if (data.type === "transcript") {
          console.log("STT:", data.text);
        }

      };

      ws.onerror = (e) => console.error("WS error", e);

    }
    catch (err) {

      console.error("Join failed:", err);

    }

    setLoading(false);
  };

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay hidden />

      <button
        onClick={joinMeeting}
        disabled={loading}
        className="rounded-3xl w-[180px] py-5 font-semibold mt-20
        text-[#F2FAF5]
        bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]"
      >
        {loading ? "Connecting..." : "Join Now"}
      </button>
    </>
  );
};

export default MeetingButton;