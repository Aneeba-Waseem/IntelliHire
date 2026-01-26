import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import '@fortawesome/fontawesome-free/css/all.min.css';
import AuthPage from "./Components/Auth/AuthPage";
import LandingPage from "./Components/LandingPage";
import HRDashboard from "./Components/HRDashboard";
import MeetingInterface from "./Components/MeetingInterface";
import useAuthRefresh from "./hooks/useAuthRefresh";
import HeroSection from "./Components/LandingPage/HeroSection";
import Navbar from "./Components/LandingPage/Navbar";
import Footer from "./Components/LandingPage/Footer";
import TopBar from "./Components/CommonComponents/TopBar";
import MeetInterface from "./Components/Meeting/MeetInterface";
import CommonPage from "./Components/CommonComponents/CommonPage";
import MeetingPermissions from "./Components/Meeting/MeetingPermission";
function App() {
  useAuthRefresh(); // refresh token every 14 min

  const location = useLocation();
  // Pages where we don't want Navbar and Footer
  const LandingNavBar = location.pathname === "/heroSection";
  const auth = location.pathname === "/auth";

  return (
    <div>
      {/* Conditionally render Navbar */}
      {LandingNavBar && <Navbar />}
      {!LandingNavBar && !auth && <TopBar/>}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<HRDashboard />} />
        <Route path="/heroSection" element={<HeroSection />} />
        <Route path="/meeting" element={<MeetingInterface />} />        
        <Route path="/common" element={<CommonPage />} />
        <Route path="/meetingSection" element={<MeetInterface />} />
        <Route path="/meetingPermissions" element={<MeetingPermissions />} />
      </Routes>
      {/* <Footer /> */}
      {/* Conditionally render Footer */}
      {!auth && <Footer />}
    </div>
  );
}

export default App;
