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

      // ════════════════════════════════════════════
      // STEP 1: Get local media
      // ════════════════════════════════════════════
      console.log("[1] Requesting local media...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      console.log("✅ [1] Media stream acquired");

      // ════════════════════════════════════════════
      // STEP 2: Create peer connection
      // ════════════════════════════════════════════
      console.log("[2] Creating RTCPeerConnection...");
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });
      console.log("✅ [2] RTCPeerConnection created");

      // ════════════════════════════════════════════
      // STEP 3: Add local audio & video tracks
      // ════════════════════════════════════════════
      console.log("[3] Adding local tracks...");
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log(`  ✅ Added local ${track.kind} track`);
      });
      console.log("✅ [3] Local tracks added");

      // ════════════════════════════════════════════
      // ⭐ STEP 4: ADD AUDIO TRANSCEIVER (CRITICAL!)
      // ════════════════════════════════════════════
      console.log("[4] Adding audio transceiver...");
      try {
        const audioTransceiver = pc.addTransceiver("audio", {
          direction: "recvonly",
        });
        console.log("✅ [4] Audio transceiver added (recvonly)");
      } catch (err) {
        console.error("❌ [4] Failed to add transceiver:", err);
      }

      // ════════════════════════════════════════════
      // ⭐ STEP 5: SET UP ontrack HANDLER NOW
      // ════════════════════════════════════════════
      console.log("[5] Setting up ontrack handler (EARLY)...");
      
      // Create a temporary audio element to capture the stream
      const tempAudio = new Audio();
      tempAudio.style.display = "none";
      document.body.appendChild(tempAudio);

      let remoteStream = null;

      pc.ontrack = (event) => {
        console.log("\n" + "🎉".repeat(30));
        console.log("🎉 pc.ontrack FIRED IN MEETINGBUTTON 🎉");
        console.log("🎉".repeat(30));

        console.log("Track details:", {
          kind: event.track.kind,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
          streams: event.streams.length,
        });

        if (event.track.kind === "audio" && event.streams.length > 0) {
          remoteStream = event.streams[0];
          console.log("✅ Audio stream captured:", remoteStream.id);

          // Try to play on temp audio to verify it works
          tempAudio.srcObject = remoteStream;
          tempAudio
            .play()
            .then(() => {
              console.log("✅ Audio playing on temp element");
              tempAudio.pause(); // Pause it, Meet component will play
            })
            .catch((err) => {
              console.warn("⚠️ Temp audio play:", err.message);
            });

          // Store the stream in webrtcStore so Meet can use it
          webrtcStore.remoteAudioStream = remoteStream;
          console.log("✅ Remote audio stream stored in webrtcStore");
        }
      };

      console.log("✅ [5] ontrack handler ready");

      // ════════════════════════════════════════════
      // STEP 6: Setup connection state listeners
      // ════════════════════════════════════════════
      console.log("[6] Setting up connection listeners...");

      pc.onconnectionstatechange = () => {
        console.log(`📊 Connection state: ${pc.connectionState}`);
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`❄️ ICE connection state: ${pc.iceConnectionState}`);
      };

      console.log("✅ [6] Listeners attached");

      // ════════════════════════════════════════════
      // STEP 7: Setup ICE candidate handler
      // ════════════════════════════════════════════
      console.log("[7] Setting up ICE candidate handler...");
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "ice",
              candidate: event.candidate,
            })
          );
        }
      };
      console.log("✅ [7] ICE handler ready");

      // ════════════════════════════════════════════
      // ⭐ STEP 8: CREATE SESSION ID & SETUP WEBSOCKET
      // ════════════════════════════════════════════
      console.log("[8] Creating session ID and connecting WebSocket...");
      
      // ⭐ CRITICAL: Create sessionId FIRST
      const sessionId = uuidv4();
      console.log("📍 Session ID created:", sessionId);
      
      // ⭐ CRITICAL: Store in context IMMEDIATELY (before WebSocket)
      setWebRtcSessionId(sessionId);
      console.log("✅ Session ID stored in context");
      
      // ⭐ CRITICAL: Also store in webrtcStore for component access
      webrtcStore.webRtcSessionId = sessionId;
      console.log("✅ Session ID stored in webrtcStore");
      
      const ws = new WebSocket(
        `ws://localhost:8001/api/webrtc/ws/${sessionId}`
      );

      ws.onopen = async () => {
        console.log("✅ [8] WebSocket connected");

        console.log("[9] Sending auth...");
        ws.send(JSON.stringify({ type: "auth", token }));
        console.log("✅ [9] Auth sent");

        console.log("[10] Creating offer...");
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log("✅ [10] Offer created");

          ws.send(
            JSON.stringify({
              type: "offer",
              sdp: offer.sdp,
            })
          );
          console.log("✅ [10] Offer sent");
        } catch (err) {
          console.error("❌ [10] Offer error:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        setLoading(false);
      };

      // ════════════════════════════════════════════
      // STEP 11: Handle WebSocket messages
      // ════════════════════════════════════════════
      ws.onmessage = async (msg) => {
        try {
          const data = JSON.parse(msg.data);

          if (data.type === "answer") {
            console.log("[11] Received answer");

            await pc.setRemoteDescription({
              type: "answer",
              sdp: data.sdp,
            });
            console.log("✅ [11] Remote description set");

            // ⭐ Store all connection data in webrtcStore (for state persistence)
            webrtcStore.pc = pc;
            webrtcStore.ws = ws;
            webrtcStore.stream = stream;
            webrtcStore.webRtcSessionId = sessionId; // ✅ Also here for consistency

            console.log("\n" + "🎬".repeat(25));
            console.log("🎬 NAVIGATING TO MEET PAGE 🎬");
            console.log("🎬 Session ID:", sessionId);
            console.log("🎬".repeat(25) + "\n");

            // Clean up temp audio
            setTimeout(() => {
              tempAudio.pause();
              document.body.removeChild(tempAudio);
            }, 500);

            navigate("/Meet");
          }

          if (data.type === "ice") {
            try {
              await pc.addIceCandidate(data.candidate);
            } catch (err) {
              console.warn("⚠️ ICE error", err.message);
            }
          }
        } catch (err) {
          console.error("❌ Message error:", err);
        }
      };
    } catch (err) {
      console.error("❌ Join failed:", err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={joinMeeting}
      disabled={loading}
      className="rounded-3xl w-[180px] py-5 font-semibold mt-20
      text-[#F2FAF5]
      bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
      hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Connecting..." : "Join Now"}
    </button>
  );
};

export default MeetingButton;