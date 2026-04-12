import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { webrtcStore } from "../../store/webRtcStore";
import { useSession } from "./sessionContext";
import { v4 as uuidv4 } from "uuid";
import { loadAuthState } from "../../features/auth/persistAuth";

const MeetingButton = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setWebRtcSessionId } = useSession();

  const getAuthHeaders = () => {
    const authState = loadAuthState();
    const accessToken = authState?.accessToken;
    console.log(accessToken);
  
    return accessToken;
  };

  const joinMeeting = async () => {
    setLoading(true);
    try {
      const token = getAuthHeaders();

      console.log("[1] Requesting local media...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      console.log("✅ [1] Media stream acquired");

      console.log("[2] Creating RTCPeerConnection...");
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      });
      console.log("✅ [2] RTCPeerConnection created");

      console.log("[3] Adding local tracks...");
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log(`  ✅ Added local ${track.kind} track`);
      });
      console.log("✅ [3] Local tracks added");

      console.log("[4] Adding audio transceiver...");
      try {
        const audioTransceiver = pc.addTransceiver("audio", {
          direction: "recvonly",
        });
        console.log("✅ [4] Audio transceiver added (recvonly)");
      } catch (err) {
        console.error("❌ [4] Failed to add transceiver:", err);
      }

      console.log("[5] Setting up ontrack handler...");
      
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

      console.log("✅ [5] ontrack handler ready");

      console.log("[6] Setting up connection listeners...");

      let isIceConnected = false;

      pc.onconnectionstatechange = () => {
        console.log(`📊 Connection state: ${pc.connectionState}`);
        
        if (pc.connectionState === "connected" || pc.connectionState === "completed") {
          console.log("✅ PEER CONNECTION ESTABLISHED");
        }
        
        if (pc.connectionState === "failed") {
          console.error("❌ PEER CONNECTION FAILED");
          setLoading(false);
        }

        if (pc.connectionState === "disconnected" || pc.connectionState === "closed") {
          console.error("❌ PEER CONNECTION DISCONNECTED/CLOSED");
          setLoading(false);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`❄️ ICE connection state: ${pc.iceConnectionState}`);
        
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          isIceConnected = true;
          console.log("✅✅✅ ICE CONNECTION ESTABLISHED - AUDIO SHOULD FLOW NOW ✅✅✅");
        }
        
        if (pc.iceConnectionState === "failed") {
          console.error("❌❌❌ ICE CONNECTION FAILED - NO AUDIO WILL FLOW ❌❌❌");
          setLoading(false);
        }
        
        if (pc.iceConnectionState === "disconnected") {
          console.warn("⚠️ ICE disconnected (may reconnect)");
        }
      };

      console.log("✅ [6] Listeners attached");

      console.log("[7] Setting up ICE candidate handler with queuing...");
      
      let iceCandidateQueue = [];
      let wsRef = { ws: null };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`📍 ICE candidate type: ${event.candidate.candidate.split(" ")[1]} (queued)`);
          iceCandidateQueue.push(event.candidate);
          
          if (wsRef.ws && wsRef.ws.readyState === WebSocket.OPEN) {
            try {
              wsRef.ws.send(
                JSON.stringify({
                  type: "ice",
                  candidate: event.candidate,
                })
              );
              console.log("  ✅ ICE candidate sent to server");
            } catch (err) {
              console.warn("⚠️ Failed to send ICE candidate:", err.message);
            }
          }
        } else {
          console.log(`✅ ICE gathering complete (${iceCandidateQueue.length} candidates queued)`);
        }
      };
      
      console.log("✅ [7] ICE handler ready (with queuing)");

      console.log("[8] Creating session ID and connecting WebSocket...");
      
      const sessionId = uuidv4();
      console.log("📍 Session ID created:", sessionId);
      
      setWebRtcSessionId(sessionId);
      console.log("✅ Session ID stored in context");
      
      webrtcStore.webRtcSessionId = sessionId;
      console.log("✅ Session ID stored in webrtcStore");
      
      const ws = new WebSocket(`ws://localhost:8001/api/webrtc/ws/${sessionId}`);
      wsRef.ws = ws;
      let heartbeatInterval = null;

      ws.onopen = async () => {
        console.log("✅ [8] WebSocket connected");

        // heartbeatInterval = setInterval(() => {
        //   if (ws.readyState === WebSocket.OPEN) {
        //     ws.send(JSON.stringify({ type: "ping" }));
        //   }
        // }, 30000);


        console.log(`[8.5] Flushing ${iceCandidateQueue.length} queued ICE candidates...`);
        iceCandidateQueue.forEach((candidate) => {
          try {
            ws.send(
              JSON.stringify({
                type: "ice",
                candidate: candidate,
              })
            );
          } catch (err) {
            console.warn("⚠️ Failed to send queued candidate:", err.message);
          }
        });
        console.log(`✅ [8.5] All queued candidates sent (${iceCandidateQueue.length})`);

        console.log("[9] Sending auth...");
        ws.send(JSON.stringify({ type: "auth", token }));
        console.log("✅ [9] Auth sent");

        console.log("[10] Creating offer...");
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log("✅ [10] Offer created and local description set");

          ws.send(
            JSON.stringify({
              type: "offer",
              sdp: offer.sdp,
            })
          );
          console.log("✅ [10] Offer sent");
        } catch (err) {
          console.error("❌ [10] Offer error:", err);
          setLoading(false);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          ws.close();
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        setLoading(false);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      };

      ws.onclose = () => {
        console.error("❌ WebSocket closed unexpectedly");
        setLoading(false);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        pc.close();
      };

      ws.onmessage = async (msg) => {
        try {
          const data = JSON.parse(msg.data);

          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", timestamp: data.timestamp }));
            return;
          }

          if (data.type === "answer") {
            console.log("[11] Received answer");

            await pc.setRemoteDescription({
              type: "answer",
              sdp: data.sdp,
            });
            console.log("✅ [11] Remote description set");

            webrtcStore.pc = pc;
            webrtcStore.ws = ws;
            webrtcStore.stream = stream;
            webrtcStore.webRtcSessionId = sessionId;

            console.log("\n" + "🎬".repeat(25));
            console.log("🎬 OFFER-ANSWER EXCHANGE COMPLETE 🎬");
            console.log(`🎬 Session ID: ${sessionId}`);
            console.log("🎬 Waiting for ICE connection...");
            console.log("🎬".repeat(25) + "\n");

            const iceCheckInterval = setInterval(() => {
              if (isIceConnected) {
                clearInterval(iceCheckInterval);
                clearTimeout(iceCheckTimeout);
                
                console.log("\n" + "🎬".repeat(25));
                console.log("🎬 ICE CONNECTED - NAVIGATING TO MEET 🎬");
                console.log("🎬".repeat(25) + "\n");

                setTimeout(() => {
                  if (document.body.contains(tempAudio)) {
                    tempAudio.pause();
                    document.body.removeChild(tempAudio);
                  }
                }, 500);

                navigate("/Meet");
              }
            }, 500);

            const iceCheckTimeout = setTimeout(() => {
              clearInterval(iceCheckInterval);
              console.warn("⚠️ ICE did not connect within 15s, navigating anyway...");
              console.warn(`   ICE state: ${pc.iceConnectionState}`);
              console.warn(`   Connection state: ${pc.connectionState}`);
              
              if (document.body.contains(tempAudio)) {
                tempAudio.pause();
                document.body.removeChild(tempAudio);
              }
              
              navigate("/Meet");
            }, 15000);
          }

          if (data.type === "ice") {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log("✅ Server ICE candidate added");
            } catch (err) {
              console.warn("⚠️ ICE candidate error:", err.message);
            }
          }

          if (data.type === "pong") {
            console.log("✅ Pong received");
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