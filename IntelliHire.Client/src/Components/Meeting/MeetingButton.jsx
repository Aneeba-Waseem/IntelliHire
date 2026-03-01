import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const MeetingButton = ({ onConnected }) => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();

  // 🔴 Persistent audio element reference
  const remoteAudioRef = useRef(null);

  const joinMeeting = async () => {
    setLoading(true);

    try {
      // 1. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Create PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      pc.oniceconnectionstatechange = () => {
        console.log("ICE:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected") {
          console.log("[WebRTC] Connected");
        }
      };

      // 🔴 IMPORTANT: Request to receive server audio (TTS)
      pc.addTransceiver("audio", { direction: "sendrecv" });

      // 3. Send mic to server (STT)
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 🔴 Handle server audio
      pc.ontrack = (event) => {
        console.log("[WebRTC] Remote track received:", event.track.kind);

        if (event.track.kind === "audio") {
          const remoteStream = new MediaStream();
          remoteStream.addTrack(event.track);

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;

            remoteAudioRef.current
              .play()
              .then(() => console.log("Audio playing"))
              .catch((e) => console.log("Autoplay blocked:", e));
          } else {
            console.log("Remote audio element not ready");
          }
        }
      };

      // 4. Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);


      console.log("===== OFFER SDP =====");
      console.log(offer.sdp);

      // 5. Send to backend
      const response = await fetch("http://localhost:8001/api/webrtc/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "test123",
          sdp: offer.sdp,
          type: offer.type
        })
      });

      if (!response.ok) {
        throw new Error(`Offer failed: ${response.status}`);
      }

      // 6. Finalize connection
      const answer = await response.json();
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      setConnected(true);
      if (onConnected) onConnected(pc);

      // Navigate AFTER connection is ready
      navigate("/Meet");

    } catch (err) {
      console.error("Join failed:", err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔴 Hidden audio element for TTS */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

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