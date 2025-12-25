import React from "react";
import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";

import AuthPage from "./Components/Auth/AuthPage";
import LandingPage from "./Components/LandingPage";
import HRDashboard from "./Components/HRDashboard";
import MeetingInterface from "./Components/MeetingInterface";
import useAuthRefresh from "./hooks/useAuthRefresh";

function App() {
    useAuthRefresh(); // refresh token every 14 min

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<HRDashboard />} />
            <Route path="/meeting" element={<MeetingInterface />} />

            {/* Optional: catch-all route */}
            <Route path="*" element={<LandingPage />} />
        </Routes>
    );
}

export default App;
