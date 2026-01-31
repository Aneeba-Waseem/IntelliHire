// MeetingButton.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MeetingButton = ({ onConnected }) => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();
  
  const joinMeeting = async () => {
    setLoading(true);

    try {
      // 1. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Create PeerConnection
      const pc = new RTCPeerConnection();

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected") {
          console.log("[WebRTC] Connected");
        }
      };

      // 3. Attach audio track
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 4. Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 5. Send to backend
      const response = await fetch("http://localhost:8000/api/interview/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Offer failed: ${response.status}`);
      }

      const answer = await response.json();

      // 6. Finalize connection
      await pc.setRemoteDescription(answer);

      setConnected(true);
      if (onConnected) onConnected(pc);

    } catch (err) {
      console.error("Join failed:", err);
      setConnected(false);
    } finally {
      setLoading(false);
    }  
    navigate('/Meet')
  };

  return (
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
  );
};

export default MeetingButton;