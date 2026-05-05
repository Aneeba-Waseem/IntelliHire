import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { webrtcStore } from "../../store/webRtcStore";
import { useSession } from "./sessionContext";
import { v4 as uuidv4 } from "uuid";
import { loadAuthState } from "../../features/auth/persistAuth";

const MeetingButton = ({ stream, cameraOn, micOn }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setWebRtcSessionId } = useSession();
  
const [searchParams] = useSearchParams();

// const token = searchParams.get("token");
const interviewId = searchParams.get("interviewId");

  const getAuthHeaders = () => {
    const authState = loadAuthState();
    const accessToken = authState?.accessToken;
    // const accessToken = localStorage.getItem("accessToken");
    console.log(accessToken);

    return accessToken;
  };

  const joinMeeting = async () => {
    setLoading(true);
    try {
      if (!stream) {
  console.error("❌ No stream from PreJoin");
  return;
}
stream.getAudioTracks().forEach(track => {
  track.enabled = micOn;
});

stream.getVideoTracks().forEach(track => {
  track.enabled = cameraOn;
});
      const token = getAuthHeaders();

      // ════════════════════════════════════════════
      // STEP 1: Get local media
      // ════════════════════════════════════════════
      console.log("[1] Requesting local media...");

      console.log("✅ [1] Media stream acquired from preJoin component", stream, {micOn, cameraOn});

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

      // ════════════════════════════════════════════
      // ⭐ STEP 4: SET UP ontrack HANDLER
      // ════════════════════════════════════════════
      console.log("[4] Setting up ontrack handler...");

      const tempAudio = new Audio();
      tempAudio.style.display = "none";
      document.body.appendChild(tempAudio);

      let remoteStream = null;

      pc.ontrack = (event) => {
        console.log("🎉 pc.ontrack FIRED IN MEETINGBUTTON 🎉");

        console.log("Track details:", {
          kind: event.track.kind,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
          streams: event.streams.length,
        });

        if (event.track.kind === "audio" && event.streams.length > 0) {
          remoteStream = event.streams[0];
          console.log("✅ Audio stream captured:", remoteStream.id);

          tempAudio.srcObject = remoteStream;
          tempAudio
            .play()
            .then(() => {
              console.log("✅ Audio playing on temp element");
              tempAudio.pause();
            })
            .catch((err) => {
              console.warn("⚠️ Temp audio play:", err.message);
            });

          webrtcStore.remoteAudioStream = remoteStream;
          console.log("✅ Remote audio stream stored in webrtcStore");
        }
      };

      console.log("✅ [4] ontrack handler ready");

      // ════════════════════════════════════════════
      // ⭐ STEP 5: Setup connection state listeners
      // ════════════════════════════════════════════
      console.log("[5] Setting up connection listeners...");

      let isIceConnected = false;

      pc.onconnectionstatechange = () => {
        console.log(`📊 Connection state: ${pc.connectionState}`);

        if (pc.connectionState === "connected" || pc.connectionState === "completed") {
          console.log("✅ PEER CONNECTION ESTABLISHED");
        }

        if (pc.connectionState === "failed") {
          console.error("❌ PEER CONNECTION FAILED - Attempting ICE restart...");
          // Could trigger ICE restart here if needed
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`❄️ ICE connection state: ${pc.iceConnectionState}`);

        // ⭐ CRITICAL: Track when ICE actually connects
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          isIceConnected = true;
          console.log("✅ ICE CONNECTION ESTABLISHED - AUDIO SHOULD FLOW NOW ✅");
        }

        if (pc.iceConnectionState === "failed") {
          console.error("❌❌ ICE CONNECTION FAILED - NO AUDIO WILL FLOW ❌❌");
          setLoading(false);
        }

        if (pc.iceConnectionState === "disconnected") {
          console.warn("⚠️ ICE disconnected (may reconnect)");
        }
      };

      console.log("✅ [5] Listeners attached");

      // ════════════════════════════════════════════
      // ⭐ STEP 6: Setup ICE candidate handler with QUEUING
      // ════════════════════════════════════════════
      console.log("[6] Setting up ICE candidate handler with queuing...");

      // ⭐ CRITICAL: Queue candidates until WebSocket is ready
      let iceCandidateQueue = [];
      let wsReady = false;
      let pendingCandidatesSent = false;
      let iceCheckInterval = null;
      let iceCheckTimeout = null;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`📍 ICE candidate type: ${event.candidate.candidate.split(" ")[1]} (queued)`);
          iceCandidateQueue.push(event.candidate);

          // ⭐ If WebSocket is ready, send immediately
          if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "ice",
                candidate: {
                  candidate: event.candidate.candidate,      // ← SDP string
                  sdpMid: event.candidate.sdpMid,
                  sdpMLineIndex: event.candidate.sdpMLineIndex,
                },
              })
            );
            console.log("  ✅ ICE candidate sent to server");
          }
        } else {
          // ICE gathering complete
          console.log(`✅ ICE gathering complete (${iceCandidateQueue.length} candidates queued)`);
        }
      };

      console.log("✅ [6] ICE handler ready (with queuing)");

      // ════════════════════════════════════════════
      // ⭐ STEP 7: CREATE SESSION ID & SETUP WEBSOCKET
      // ════════════════════════════════════════════
      console.log("[7] Creating session ID and connecting WebSocket...");

      const sessionId = uuidv4();
      console.log("📍 Session ID created:", sessionId);

      setWebRtcSessionId(sessionId);
      console.log("✅ Session ID stored in context");

      webrtcStore.webRtcSessionId = sessionId;
      console.log("✅ Session ID stored in webrtcStore");

      const ws = new WebSocket(`ws://localhost:8001/api/webrtc/ws/${sessionId}`);

      ws.onopen = async () => {
        console.log("✅ [7] WebSocket connected");
        wsReady = true;

        webrtcStore.ws = ws;

        // ⭐ CRITICAL: Flush queued ICE candidates
        console.log(`[7.5] Flushing ${iceCandidateQueue.length} queued ICE candidates...`);
        iceCandidateQueue.forEach((candidate) => {
          ws.send(
            JSON.stringify({
              type: "ice",
              candidate: {
                candidate: candidate.candidate,      // ✅ FIXED: Use loop variable, not event
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
              },
            })
          );
        });
        pendingCandidatesSent = true;
        console.log(`✅ [7.5] All queued candidates sent (${iceCandidateQueue.length})`);

        console.log("[8] Sending auth...");
        ws.send(JSON.stringify({ type: "auth", token }));
        console.log("✅ [8] Auth sent");

        console.log("[9] Creating offer...");
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log("✅ [9] Offer created and local description set");

          ws.send(
            JSON.stringify({
              type: "offer",
              sdp: offer.sdp,
            })
          );
          console.log("✅ [9] Offer sent");
        } catch (err) {
          console.error("❌ [9] Offer error:", err);
          setLoading(false);
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        setLoading(false);
      };

      ws.onclose = () => {
        console.error("❌ WebSocket closed unexpectedly");
        // Properly clean up timers
        if (iceCheckInterval) clearInterval(iceCheckInterval);
        if (iceCheckTimeout) clearTimeout(iceCheckTimeout);
        setLoading(false);
      };

      // ════════════════════════════════════════════
      // STEP 10: Handle WebSocket messages
      // ════════════════════════════════════════════
      ws.onmessage = async (msg) => {
        try {
          const data = JSON.parse(msg.data);

          if (data.type === "answer") {
            console.log("[10] Received answer");

            await pc.setRemoteDescription({
              type: "answer",
              sdp: data.sdp,
            });
            console.log("✅ [10] Remote description set");

            // ✅ FIXED: Send interview_session_id to backend
            ws.send(JSON.stringify({
              type: "interview_session_id",
              interview_session_id: sessionId,
            }));
            console.log("✅ [10] Interview session ID sent");

            // Store connection data
            webrtcStore.pc = pc;
            webrtcStore.stream = stream;
            webrtcStore.webRtcSessionId = sessionId;
            webrtcStore.cameraOn = cameraOn;
            webrtcStore.micOn = micOn;

            console.log("🎬 OFFER-ANSWER EXCHANGE COMPLETE 🎬");
            console.log(`🎬 Session ID: ${sessionId}`);
            console.log("🎬 Waiting for ICE connection...");

            // ⭐ WAIT for ICE to actually connect before navigating
            // Give ICE gathering + connection 10 seconds max
            iceCheckInterval = setInterval(() => {
              if (isIceConnected) {
                clearInterval(iceCheckInterval);
                clearTimeout(iceCheckTimeout);

                console.log("🎬 ICE CONNECTED - NAVIGATING TO MEET 🎬");

                setTimeout(() => {
                  if (document.body.contains(tempAudio)) {
                    document.body.removeChild(tempAudio);
                  }
                }, 500);

                // navigate("/Meet");
                navigate(`/Meet?interviewId=${interviewId}`);
              }
            }, 500);

            // Timeout after 10 seconds
            iceCheckTimeout = setTimeout(() => {
              clearInterval(iceCheckInterval);
              console.error("⚠️ ICE did not connect within 10s, navigating anyway...");
              console.error(`   ICE state: ${pc.iceConnectionState}`);
              console.error(`   Connection state: ${pc.connectionState}`);

              navigate("/Meet");
            }, 10000);
          }

          if (data.type === "ice") {
            try {
              await pc.addIceCandidate(data.candidate);
              console.log("✅ Server ICE candidate added");
            } catch (err) {
              console.warn("⚠️ ICE candidate error", err.message);
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
  <div className="flex flex-col items-center">
    
    

    <button
      onClick={joinMeeting}
      disabled={loading || !stream}
      className="rounded-3xl w-[180px] py-5 font-semibold
      text-[#F2FAF5]
      bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
      hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Connecting..." : "Join Now"}
    </button>

  </div>
);
};

export default MeetingButton;