import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import AuthPage from "./Components/Auth/AuthPage";
import LandingPage from "./Components/LandingPage";
import HRDashboard from "./Components/HRDashboard";
import MeetingInterface from "./Components/MeetingInterface";
import useAuthRefresh from "./hooks/useAuthRefresh";
import HeroSection from "./Components/LandingPage/HeroSection";
import TakeInterview from "./Components/userPages/TakeInterview";
import Navbar from "./Components/LandingPage/Navbar";
import Footer from "./Components/LandingPage/Footer";

function App() {
  useAuthRefresh(); // refresh token every 14 min

  const location = useLocation();
  // Pages where we don't want Navbar and Footer
  const hideLayout = location.pathname === "/auth";

  return (
    <div>
      {/* Conditionally render Navbar */}
      {!hideLayout && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<HRDashboard />} />
        <Route path="/heroSection" element={<HeroSection />} />
        <Route path="/meeting" element={<MeetingInterface />} />
        <Route path="/take-interview" element={<TakeInterview />} />
      </Routes>

      {/* Conditionally render Footer */}
      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;
