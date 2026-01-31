import React, { useState, useEffect, useRef } from "react";
import { motion as Motion } from 'framer-motion'
import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";
import MeetingButton from "./MeetingButton";

const MeetPreJoin = () => {
    const [cameraOn, setCameraOn] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    
    const handleClick = (e) => {
        navigate('/Meet')
    };
    
    // Handle camera + mic stream
    useEffect(() => {
        const getMedia = async () => {
            try {
                if (cameraOn || micOn) {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: cameraOn,
                        audio: micOn,
                    });
                    setStream(mediaStream);

                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                        videoRef.current.muted = true; // prevent echo
                        await videoRef.current.play();
                    }
                } else {
                    // Stop all tracks if both camera and mic are off
                    if (stream) {
                        stream.getTracks().forEach((track) => track.stop());
                        setStream(null);
                    }
                }
            } catch (err) {
                console.error("Camera/Mic access denied:", err);
                setCameraOn(false);
                setMicOn(false);
            }
        };

        getMedia();
    }, [cameraOn, micOn]);

    // Enable/disable audio track dynamically
    useEffect(() => {
        if (stream) {
            stream.getAudioTracks().forEach((track) => {
                track.enabled = micOn;
            });
        }
    }, [micOn, stream]);

    return (
        <div className="flex h-screen w-full bg-[#D1DED3] items-center justify-center p-4">
            {/* Left: Video box */}
            <div className="w-2/3 h-3/4 bg-black flex items-center justify-center rounded-lg overflow-hidden">
                {cameraOn ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: "scaleX(-1)" }} // mirrored preview like Meet
                    />
                ) : (
                    <div className="text-white text-center text-lg">
                        Camera is Off
                    </div>
                )}
            </div>

            {/* Right: Controls */}
            <div className="w-1/3 h-3/4 flex flex-col items-center justify-center space-y-6 ml-6">
                {/* Camera Button */}
                <button
                    onClick={() => setCameraOn((prev) => !prev)}
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{
                        backgroundColor: cameraOn ? "#29445D" : "#719D99",
                        boxShadow: cameraOn ? "0 6px 12px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                >
                    {cameraOn ? <FiVideo /> : <FiVideoOff />}
                </button>

                {/* Mic Button */}
                <button
                    onClick={() => setMicOn((prev) => !prev)}
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{
                        backgroundColor: micOn ? "#29445D" : "#719D99",
                        boxShadow: micOn ? "0 6px 12px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                >
                    {micOn ? <FiMic /> : <FiMicOff />}
                </button>

                {/* Join Now Button */}
                <MeetingButton
                    onConnected={(pc) => {
                        console.log("PeerConnection established:", pc);
                        // You can store the pc if needed in state for future use
                    }}
                />

            </div>
        </div>
    );
};

export default MeetPreJoin;
