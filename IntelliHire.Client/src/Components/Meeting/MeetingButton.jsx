// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { webrtcStore } from "../../store/webRtcStore";
// import { useSession } from "./sessionContext";
// import { v4 as uuidv4 } from "uuid";
// import { loadAuthState } from "../../features/auth/persistAuth";

// const MeetingButton = () => {
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();
//   const { setWebRtcSessionId } = useSession();

//   const getAuthHeaders = () => {
//     const authState = loadAuthState();
//     const accessToken = authState?.accessToken;
//     console.log(accessToken);
  
//     return accessToken;
//   };

//   const joinMeeting = async () => {
//     setLoading(true);
//     try {
//       const token = getAuthHeaders();

//       // ════════════════════════════════════════════
//       // STEP 1: Get local media
//       // ════════════════════════════════════════════
//       console.log("[1] Requesting local media...");
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: true,
//       });
//       console.log("✅ [1] Media stream acquired");

//       // ════════════════════════════════════════════
//       // STEP 2: Create peer connection
//       // ════════════════════════════════════════════
//       console.log("[2] Creating RTCPeerConnection...");
//       const pc = new RTCPeerConnection({
//         iceServers: [
//           { urls: "stun:stun.l.google.com:19302" },
//           { urls: "stun:stun1.l.google.com:19302" },
//           { urls: "stun:stun2.l.google.com:19302" },
//         ],
//       });
//       console.log("✅ [2] RTCPeerConnection created");

//       // ════════════════════════════════════════════
//       // STEP 3: Add local audio & video tracks
//       // ════════════════════════════════════════════
//       console.log("[3] Adding local tracks...");
//       stream.getTracks().forEach((track) => {
//         pc.addTrack(track, stream);
//         console.log(`  ✅ Added local ${track.kind} track`);
//       });
//       console.log("✅ [3] Local tracks added");

//       // ════════════════════════════════════════════
//       // STEP 4: ADD AUDIO TRANSCEIVER
//       // ════════════════════════════════════════════
//       console.log("[4] Adding audio transceiver...");
//       try {
//         const audioTransceiver = pc.addTransceiver("audio", {
//           direction: "recvonly",
//         });
//         console.log("✅ [4] Audio transceiver added (recvonly)");
//       } catch (err) {
//         console.error("❌ [4] Failed to add transceiver:", err);
//       }

//       // ════════════════════════════════════════════
//       // ⭐ STEP 5: SET UP ontrack HANDLER
//       // ════════════════════════════════════════════
//       console.log("[5] Setting up ontrack handler...");
      
//       const tempAudio = new Audio();
//       tempAudio.style.display = "none";
//       document.body.appendChild(tempAudio);

//       let remoteStream = null;

//       pc.ontrack = (event) => {
//         console.log("\n" + "🎉".repeat(30));
//         console.log("🎉 pc.ontrack FIRED IN MEETINGBUTTON 🎉");
//         console.log("🎉".repeat(30));

//         console.log("Track details:", {
//           kind: event.track.kind,
//           enabled: event.track.enabled,
//           readyState: event.track.readyState,
//           streams: event.streams.length,
//         });

//         if (event.track.kind === "audio" && event.streams.length > 0) {
//           remoteStream = event.streams[0];
//           console.log("✅ Audio stream captured:", remoteStream.id);

//           tempAudio.srcObject = remoteStream;
//           tempAudio
//             .play()
//             .then(() => {
//               console.log("✅ Audio playing on temp element");
//               tempAudio.pause();
//             })
//             .catch((err) => {
//               console.warn("⚠️ Temp audio play:", err.message);
//             });

//           webrtcStore.remoteAudioStream = remoteStream;
//           console.log("✅ Remote audio stream stored in webrtcStore");
//         }
//       };

//       console.log("✅ [5] ontrack handler ready");

//       // ════════════════════════════════════════════
//       // ⭐ STEP 6: Setup connection state listeners
//       // ════════════════════════════════════════════
//       console.log("[6] Setting up connection listeners...");

//       let isIceConnected = false;

//       pc.onconnectionstatechange = () => {
//         console.log(`📊 Connection state: ${pc.connectionState}`);
        
//         if (pc.connectionState === "connected" || pc.connectionState === "completed") {
//           console.log("✅ PEER CONNECTION ESTABLISHED");
//         }
        
//         if (pc.connectionState === "failed") {
//           console.error("❌ PEER CONNECTION FAILED - Attempting ICE restart...");
//           // Could trigger ICE restart here if needed
//         }
//       };

//       pc.oniceconnectionstatechange = () => {
//         console.log(`❄️ ICE connection state: ${pc.iceConnectionState}`);
        
//         // ⭐ CRITICAL: Track when ICE actually connects
//         if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
//           isIceConnected = true;
//           console.log("✅✅✅ ICE CONNECTION ESTABLISHED - AUDIO SHOULD FLOW NOW ✅✅✅");
//         }
        
//         if (pc.iceConnectionState === "failed") {
//           console.error("❌❌❌ ICE CONNECTION FAILED - NO AUDIO WILL FLOW ❌❌❌");
//           setLoading(false);
//         }
        
//         if (pc.iceConnectionState === "disconnected") {
//           console.warn("⚠️ ICE disconnected (may reconnect)");
//         }
//       };

//       console.log("✅ [6] Listeners attached");

//       // ════════════════════════════════════════════
//       // ⭐ STEP 7: Setup ICE candidate handler with QUEUING
//       // ════════════════════════════════════════════
//       console.log("[7] Setting up ICE candidate handler with queuing...");
      
//       // ⭐ CRITICAL: Queue candidates until WebSocket is ready
//       let iceCandidateQueue = [];
//       let wsReady = false;
//       let pendingCandidatesSent = false;

//       pc.onicecandidate = (event) => {
//         if (event.candidate) {
//           console.log(`📍 ICE candidate type: ${event.candidate.candidate.split(" ")[1]} (queued)`);
//           iceCandidateQueue.push(event.candidate);
          
//           // ⭐ If WebSocket is ready, send immediately
//           if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
//             ws.send(
//               JSON.stringify({
//                 type: "ice",
//                 candidate: event.candidate,
//               })
//             );
//             console.log("  ✅ ICE candidate sent to server");
//           }
//         } else {
//           // ICE gathering complete
//           console.log(`✅ ICE gathering complete (${iceCandidateQueue.length} candidates queued)`);
//         }
//       };
      
//       console.log("✅ [7] ICE handler ready (with queuing)");

//       // ════════════════════════════════════════════
//       // ⭐ STEP 8: CREATE SESSION ID & SETUP WEBSOCKET
//       // ════════════════════════════════════════════
//       console.log("[8] Creating session ID and connecting WebSocket...");
      
//       const sessionId = uuidv4();
//       console.log("📍 Session ID created:", sessionId);
      
//       setWebRtcSessionId(sessionId);
//       console.log("✅ Session ID stored in context");
      
//       webrtcStore.webRtcSessionId = sessionId;
//       console.log("✅ Session ID stored in webrtcStore");
      
//     const ws = new WebSocket(`ws://localhost:8001/api/webrtc/ws/${sessionId}`);

//       ws.onopen = async () => {
//         console.log("✅ [8] WebSocket connected");
//         wsReady = true;

//         // ⭐ CRITICAL: Flush queued ICE candidates
//         console.log(`[8.5] Flushing ${iceCandidateQueue.length} queued ICE candidates...`);
//         iceCandidateQueue.forEach((candidate) => {
//           ws.send(
//             JSON.stringify({
//               type: "ice",
//               candidate: candidate,
//             })
//           );
//         });
//         pendingCandidatesSent = true;
//         console.log(`✅ [8.5] All queued candidates sent (${iceCandidateQueue.length})`);

//         console.log("[9] Sending auth...");
//         ws.send(JSON.stringify({ type: "auth", token }));
//         console.log("✅ [9] Auth sent");

//         console.log("[10] Creating offer...");
//         try {
//           const offer = await pc.createOffer();
//           await pc.setLocalDescription(offer);
//           console.log("✅ [10] Offer created and local description set");

//           ws.send(
//             JSON.stringify({
//               type: "offer",
//               sdp: offer.sdp,
//             })
//           );
//           console.log("✅ [10] Offer sent");
//         } catch (err) {
//           console.error("❌ [10] Offer error:", err);
//           setLoading(false);
//         }
//       };

//       ws.onerror = (err) => {
//         console.error("❌ WebSocket error:", err);
//         setLoading(false);
//       };

//       ws.onclose = () => {
//         console.error("❌ WebSocket closed unexpectedly");
//         setLoading(false);
//       };

//       // ════════════════════════════════════════════
//       // STEP 11: Handle WebSocket messages
//       // ════════════════════════════════════════════
//       ws.onmessage = async (msg) => {
//         try {
//           const data = JSON.parse(msg.data);

//           if (data.type === "answer") {
//             console.log("[11] Received answer");

//             await pc.setRemoteDescription({
//               type: "answer",
//               sdp: data.sdp,
//             });
//             console.log("✅ [11] Remote description set");

//             // Store connection data
//             webrtcStore.pc = pc;
//             webrtcStore.ws = ws;
//             webrtcStore.stream = stream;
//             webrtcStore.webRtcSessionId = sessionId;

//             console.log("\n" + "🎬".repeat(25));
//             console.log("🎬 OFFER-ANSWER EXCHANGE COMPLETE 🎬");
//             console.log(`🎬 Session ID: ${sessionId}`);
//             console.log("🎬 Waiting for ICE connection...");
//             console.log("🎬".repeat(25) + "\n");

//             // ⭐ WAIT for ICE to actually connect before navigating
//             // Give ICE gathering + connection 10 seconds max
//             const iceCheckInterval = setInterval(() => {
//               if (isIceConnected) {
//                 clearInterval(iceCheckInterval);
//                 clearTimeout(iceCheckTimeout);
                
//                 console.log("\n" + "🎬".repeat(25));
//                 console.log("🎬 ICE CONNECTED - NAVIGATING TO MEET 🎬");
//                 console.log("🎬".repeat(25) + "\n");

//                 setTimeout(() => {
//                   tempAudio.pause();
//                   document.body.removeChild(tempAudio);
//                 }, 500);

//                 navigate("/Meet");
//               }
//             }, 500);

//             // Timeout after 10 seconds
//             const iceCheckTimeout = setTimeout(() => {
//               clearInterval(iceCheckInterval);
//               console.error("⚠️ ICE did not connect within 10s, navigating anyway...");
//               console.error(`   ICE state: ${pc.iceConnectionState}`);
//               console.error(`   Connection state: ${pc.connectionState}`);
              
//               navigate("/Meet");
//             }, 10000);
//           }

//           if (data.type === "ice") {
//             try {
//               await pc.addIceCandidate(data.candidate);
//               console.log("✅ Server ICE candidate added");
//             } catch (err) {
//               console.warn("⚠️ ICE candidate error", err.message);
//             }
//           }
//         } catch (err) {
//           console.error("❌ Message error:", err);
//         }
//       };
//     } catch (err) {
//       console.error("❌ Join failed:", err);
//       setLoading(false);
//     }
//   };

//   return (
//     <button
//       onClick={joinMeeting}
//       disabled={loading}
//       className="rounded-3xl w-[180px] py-5 font-semibold mt-20
//       text-[#F2FAF5]
//       bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
//       hover:opacity-90 disabled:opacity-50"
//     >
//       {loading ? "Connecting..." : "Join Now"}
//     </button>
//   );
// };

// export default MeetingButton;
















// // import React, { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { webrtcStore } from "../../store/webRtcStore";
// // import { useSession } from "./sessionContext";
// // import { v4 as uuidv4 } from "uuid";
// // import { loadAuthState } from "../../features/auth/persistAuth";

// // const MeetingButton = () => {
// //   const [loading, setLoading] = useState(false);
// //   const navigate = useNavigate();
// //   const { setWebRtcSessionId } = useSession();

// //   const getAuthHeaders = () => {
// //     const authState = loadAuthState();
// //     const accessToken = authState?.accessToken;
// //     console.log(accessToken);
  
// //     return accessToken;
// //   };

// //   const joinMeeting = async () => {
// //     setLoading(true);
// //     try {
// //       const token = getAuthHeaders();

// //       // ════════════════════════════════════════════
// //       // STEP 1: Get local media
// //       // ════════════════════════════════════════════
// //       console.log("[1] Requesting local media...");
// //       const stream = await navigator.mediaDevices.getUserMedia({
// //         audio: true,
// //         video: true,
// //       });
// //       console.log("✅ [1] Media stream acquired");

// //       // ════════════════════════════════════════════
// //       // STEP 2: Create peer connection
// //       // ════════════════════════════════════════════
// //       console.log("[2] Creating RTCPeerConnection...");
// //       const pc = new RTCPeerConnection({
// //         iceServers: [
// //           { urls: "stun:stun.l.google.com:19302" },
// //           { urls: "stun:stun1.l.google.com:19302" },
// //           { urls: "stun:stun2.l.google.com:19302" },
// //           // add a turn server here if you have one for better connectivity in restrictive networks. 
// //           // turn is required if both parties are not on the same local network or are behind symmetric NATs/firewalls.
// //           // for now, stun alone is fine.
// //         ],
// //       });
// //       console.log("✅ [2] RTCPeerConnection created");

// //       // ════════════════════════════════════════════
// //       // STEP 3: Add local audio & video tracks
// //       // ════════════════════════════════════════════
// //       console.log("[3] Adding local tracks...");
// //       stream.getTracks().forEach((track) => {
// //         pc.addTrack(track, stream);
// //         console.log(`  ✅ Added local ${track.kind} track`);
// //       });
// //       console.log("✅ [3] Local tracks added");

// //       // ════════════════════════════════════════════
// //       // STEP 4: ADD AUDIO TRANSCEIVER
// //       // ════════════════════════════════════════════
// //       console.log("[4] Adding audio transceiver...");
// //       try {
// //         const audioTransceiver = pc.addTransceiver("audio", {
// //           direction: "recvonly",
// //         });
// //         console.log("✅ [4] Audio transceiver added (recvonly)");
// //       } catch (err) {
// //         console.error("❌ [4] Failed to add transceiver:", err);
// //       }

// //       // ════════════════════════════════════════════
// //       // ⭐ STEP 5: SET UP ontrack HANDLER
// //       // ════════════════════════════════════════════
// //       console.log("[5] Setting up ontrack handler...");
      
// //       const tempAudio = new Audio();
// //       tempAudio.style.display = "none";
// //       document.body.appendChild(tempAudio);

// //       let remoteStream = null;

// //       pc.ontrack = (event) => {
// //         console.log("\n" + "🎉".repeat(30));
// //         console.log("🎉 pc.ontrack FIRED IN MEETINGBUTTON 🎉");
// //         console.log("🎉".repeat(30));

// //         console.log("Track details:", {
// //           kind: event.track.kind,
// //           enabled: event.track.enabled,
// //           readyState: event.track.readyState,
// //           streams: event.streams.length,
// //         });

// //         if (event.track.kind === "audio" && event.streams.length > 0) {
// //           remoteStream = event.streams[0];
// //           console.log("✅ Audio stream captured:", remoteStream.id);

// //           tempAudio.srcObject = remoteStream;
// //           tempAudio
// //             .play()
// //             .then(() => {
// //               console.log("✅ Audio playing on temp element");
// //               tempAudio.pause();
// //             })
// //             .catch((err) => {
// //               console.warn("⚠️ Temp audio play:", err.message);
// //             });

// //           webrtcStore.remoteAudioStream = remoteStream;
// //           console.log("✅ Remote audio stream stored in webrtcStore");
// //         }
// //       };

// //       console.log("✅ [5] ontrack handler ready");

// //       // ════════════════════════════════════════════
// //       // ⭐ STEP 6: Setup connection state listeners
// //       // ════════════════════════════════════════════
// //       console.log("[6] Setting up connection listeners...");

// //       let isIceConnected = false;

// //       pc.onconnectionstatechange = () => {
// //         console.log(`📊 Connection state: ${pc.connectionState}`);
        
// //         if (pc.connectionState === "connected" || pc.connectionState === "completed") {
// //           console.log("✅ PEER CONNECTION ESTABLISHED");
// //         }
        
// //         if (pc.connectionState === "failed") {
// //           console.error("❌ PEER CONNECTION FAILED - Attempting ICE restart...");
// //           // Could trigger ICE restart here if needed
// //         }
// //       };

// //       pc.oniceconnectionstatechange = () => {
// //         console.log(`❄️ ICE connection state: ${pc.iceConnectionState}`);
        
// //         // ⭐ CRITICAL: Track when ICE actually connects
// //         if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
// //           isIceConnected = true;
// //           console.log("✅✅✅ ICE CONNECTION ESTABLISHED - AUDIO SHOULD FLOW NOW ✅✅✅");
// //         }
        
// //         if (pc.iceConnectionState === "failed") {
// //           console.error("❌❌❌ ICE CONNECTION FAILED - NO AUDIO WILL FLOW ❌❌❌");
// //           setLoading(false);
// //         }
        
// //         if (pc.iceConnectionState === "disconnected") {
// //           console.warn("⚠️ ICE disconnected (may reconnect)");
// //         }
// //       };

// //       console.log("✅ [6] Listeners attached");

// //       // ════════════════════════════════════════════
// //       // ⭐ STEP 7: Setup ICE candidate handler with QUEUING
// //       // ════════════════════════════════════════════
// //       console.log("[7] Setting up ICE candidate handler with queuing...");
      
// //       // ⭐ CRITICAL: Queue candidates until WebSocket is ready
// //       let iceCandidateQueue = [];
// //       let wsReady = false;
// //       let pendingCandidatesSent = false;

// //       pc.onicecandidate = (event) => {
// //         if (event.candidate) {
// //           console.log(`📍 ICE candidate type: ${event.candidate.candidate.split(" ")[1]} (queued)`);
// //           iceCandidateQueue.push(event.candidate);
          
// //           // ⭐ If WebSocket is ready, send immediately
// //           if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
// //             ws.send(
// //               JSON.stringify({
// //                 type: "ice",
// //                 candidate: event.candidate,
// //               })
// //             );
// //             console.log("  ✅ ICE candidate sent to server");
// //           }
// //         } else {
// //           // ICE gathering complete
// //           console.log(`✅ ICE gathering complete (${iceCandidateQueue.length} candidates queued)`);
// //         }
// //       };
      
// //       console.log("✅ [7] ICE handler ready (with queuing)");

// //       // ════════════════════════════════════════════
// //       // ⭐ STEP 8: CREATE SESSION ID & SETUP WEBSOCKET
// //       // ════════════════════════════════════════════
// //       console.log("[8] Creating session ID and connecting WebSocket...");
      
// //       const sessionId = uuidv4();
// //       console.log("📍 Session ID created:", sessionId);
      
// //       setWebRtcSessionId(sessionId);
// //       console.log("✅ Session ID stored in context");
      
// //       webrtcStore.webRtcSessionId = sessionId;
// //       console.log("✅ Session ID stored in webrtcStore");
      
// //     const ws = new WebSocket(`ws://localhost:8001/api/webrtc/ws/${sessionId}`);

// //       ws.onopen = async () => {
// //         console.log("✅ [8] WebSocket connected");
// //         wsReady = true;

// //         // ⭐ CRITICAL: Flush queued ICE candidates
// //         console.log(`[8.5] Flushing ${iceCandidateQueue.length} queued ICE candidates...`);
// //         iceCandidateQueue.forEach((candidate) => {
// //           ws.send(
// //             JSON.stringify({
// //               type: "ice",
// //               candidate: candidate,
// //             })
// //           );
// //         });
// //         pendingCandidatesSent = true;
// //         console.log(`✅ [8.5] All queued candidates sent (${iceCandidateQueue.length})`);

// //         console.log("[9] Sending auth...");
// //         ws.send(JSON.stringify({ type: "auth", token }));
// //         console.log("✅ [9] Auth sent");

// //         console.log("[10] Creating offer...");
// //         try {
// //           const offer = await pc.createOffer();
// //           await pc.setLocalDescription(offer);
// //           console.log("✅ [10] Offer created and local description set");

// //           ws.send(
// //             JSON.stringify({
// //               type: "offer",
// //               sdp: offer.sdp,
// //             })
// //           );
// //           console.log("✅ [10] Offer sent");
// //         } catch (err) {
// //           console.error("❌ [10] Offer error:", err);
// //           setLoading(false);
// //         }
// //       };

// //       ws.onerror = (err) => {
// //         console.error("❌ WebSocket error:", err);
// //         setLoading(false);
// //       };

// //       ws.onclose = () => {
// //         console.error("❌ WebSocket closed unexpectedly");
// //         setLoading(false);
// //       };

// //       // ════════════════════════════════════════════
// //       // STEP 11: Handle WebSocket messages
// //       // ════════════════════════════════════════════
// //       ws.onmessage = async (msg) => {
// //         try {
// //           const data = JSON.parse(msg.data);

// //           if (data.type === "answer") {
// //             console.log("[11] Received answer");

// //             await pc.setRemoteDescription({
// //               type: "answer",
// //               sdp: data.sdp,
// //             });
// //             console.log("✅ [11] Remote description set");

// //             // Store connection data
// //             webrtcStore.pc = pc;
// //             webrtcStore.ws = ws;
// //             webrtcStore.stream = stream;
// //             webrtcStore.webRtcSessionId = sessionId;

// //             console.log("\n" + "🎬".repeat(25));
// //             console.log("🎬 OFFER-ANSWER EXCHANGE COMPLETE 🎬");
// //             console.log(`🎬 Session ID: ${sessionId}`);
// //             console.log("🎬 Waiting for ICE connection...");
// //             console.log("🎬".repeat(25) + "\n");

// //             // ⭐ WAIT for ICE to actually connect before navigating
// //             // Give ICE gathering + connection 10 seconds max
// //             const iceCheckInterval = setInterval(() => {
// //               if (isIceConnected) {
// //                 clearInterval(iceCheckInterval);
// //                 clearTimeout(iceCheckTimeout);
                
// //                 console.log("\n" + "🎬".repeat(25));
// //                 console.log("🎬 ICE CONNECTED - NAVIGATING TO MEET 🎬");
// //                 console.log("🎬".repeat(25) + "\n");

// //                 setTimeout(() => {
// //                   tempAudio.pause();
// //                   document.body.removeChild(tempAudio);
// //                 }, 500);

// //                 navigate("/Meet");
// //               }
// //             }, 500);

// //             // Timeout after 10 seconds
// //             const iceCheckTimeout = setTimeout(() => {
// //               clearInterval(iceCheckInterval);
// //               console.error("⚠️ ICE did not connect within 10s, navigating anyway...");
// //               console.error(`   ICE state: ${pc.iceConnectionState}`);
// //               console.error(`   Connection state: ${pc.connectionState}`);
              
// //               navigate("/Meet");
// //             }, 10000);
// //           }

// //           if (data.type === "ice") {
// //             try {
// //               await pc.addIceCandidate(data.candidate);
// //               console.log("✅ Server ICE candidate added");
// //             } catch (err) {
// //               console.warn("⚠️ ICE candidate error", err.message);
// //             }
// //           }
// //         } catch (err) {
// //           console.error("❌ Message error:", err);
// //         }
// //       };
// //     } catch (err) {
// //       console.error("❌ Join failed:", err);
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <button
// //       onClick={joinMeeting}
// //       disabled={loading}
// //       className="rounded-3xl w-[180px] py-5 font-semibold mt-20
// //       text-[#F2FAF5]
// //       bg-gradient-to-r from-[#29445D] via-[#45767C] to-[#719D99]
// //       hover:opacity-90 disabled:opacity-50"
// //     >
// //       {loading ? "Connecting..." : "Join Now"}
// //     </button>
// //   );
// // };

// // export default MeetingButton;

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
      // STEP 4: ADD AUDIO TRANSCEIVER
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
      // ⭐ STEP 5: SET UP ontrack HANDLER
      // ════════════════════════════════════════════
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

      // ════════════════════════════════════════════
      // ⭐ STEP 6: Setup connection state listeners
      // ════════════════════════════════════════════
      console.log("[6] Setting up connection listeners...");

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

      // ════════════════════════════════════════════
      // ⭐ STEP 7: Setup ICE candidate handler with QUEUING
      // ════════════════════════════════════════════
      console.log("[7] Setting up ICE candidate handler with queuing...");
      
      // ⭐ CRITICAL: Queue candidates until WebSocket is ready
      let iceCandidateQueue = [];
      let wsReady = false;
      let pendingCandidatesSent = false;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`📍 ICE candidate type: ${event.candidate.candidate.split(" ")[1]} (queued)`);
          iceCandidateQueue.push(event.candidate);
          
          // ⭐ If WebSocket is ready, send immediately
          if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "ice",
                candidate: event.candidate,
              })
            );
            console.log("  ✅ ICE candidate sent to server");
          }
        } else {
          // ICE gathering complete
          console.log(`✅ ICE gathering complete (${iceCandidateQueue.length} candidates queued)`);
        }
      };
      
      console.log("✅ [7] ICE handler ready (with queuing)");

      // ════════════════════════════════════════════
      // ⭐ STEP 8: CREATE SESSION ID & SETUP WEBSOCKET
      // ════════════════════════════════════════════
      console.log("[8] Creating session ID and connecting WebSocket...");
      
      const sessionId = uuidv4();
      console.log("📍 Session ID created:", sessionId);
      
      setWebRtcSessionId(sessionId);
      console.log("✅ Session ID stored in context");
      
      webrtcStore.webRtcSessionId = sessionId;
      console.log("✅ Session ID stored in webrtcStore");
      
    const ws = new WebSocket(`ws://localhost:8001/api/webrtc/ws/${sessionId}`);

      ws.onopen = async () => {
        console.log("✅ [8] WebSocket connected");
        wsReady = true;

        // ⭐ CRITICAL: Flush queued ICE candidates
        console.log(`[8.5] Flushing ${iceCandidateQueue.length} queued ICE candidates...`);
        iceCandidateQueue.forEach((candidate) => {
          ws.send(
            JSON.stringify({
              type: "ice",
              candidate: candidate,
            })
          );
        });
        pendingCandidatesSent = true;
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
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        setLoading(false);
      };

      ws.onclose = () => {
        console.error("❌ WebSocket closed unexpectedly");
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

            // Store connection data
            webrtcStore.pc = pc;
            webrtcStore.ws = ws;
            webrtcStore.stream = stream;
            webrtcStore.webRtcSessionId = sessionId;

            console.log("\n" + "🎬".repeat(25));
            console.log("🎬 OFFER-ANSWER EXCHANGE COMPLETE 🎬");
            console.log(`🎬 Session ID: ${sessionId}`);
            console.log("🎬 Waiting for ICE connection...");
            console.log("🎬".repeat(25) + "\n");

            // ⭐ WAIT for ICE to actually connect before navigating
            // Give ICE gathering + connection 10 seconds max
            const iceCheckInterval = setInterval(() => {
              if (isIceConnected) {
                clearInterval(iceCheckInterval);
                clearTimeout(iceCheckTimeout);
                
                console.log("\n" + "🎬".repeat(25));
                console.log("🎬 ICE CONNECTED - NAVIGATING TO MEET 🎬");
                console.log("🎬".repeat(25) + "\n");

                setTimeout(() => {
                  tempAudio.pause();
                  document.body.removeChild(tempAudio);
                }, 500);

                navigate("/Meet");
              }
            }, 500);

            // Timeout after 10 seconds
            const iceCheckTimeout = setTimeout(() => {
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