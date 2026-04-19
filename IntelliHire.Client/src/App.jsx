import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import AuthPage from "./Components/Auth/AuthPage";
import useAuthRefresh from "./Hooks/useAuthRefresh";
import HeroSection from "./Components/LandingPage/HeroSection";
import Navbar from "./Components/LandingPage/Navbar";
import Footer from "./Components/LandingPage/Footer";
import TopBar from "./Components/CommonComponents/TopBar";
import MeetInterface from "./Components/Meeting/MeetInterface";
import CommonPage from "./Components/CommonComponents/CommonPage";
import MeetingPermissions from "./Components/Meeting/MeetingPermission";
import Dashboard from "./Components/Dashboard/Dashboard";
import Meet from "./Components/Meeting/Meet";
import { SessionProvider } from "./Components/Meeting/sessionContext";
import VerificationNotice from "./Components/Auth/VerificationNotice";
import ScheduledInterviews from "./Components/Recruiter/Scheduled/ScheduledInterview";
import { ModalProvider } from "./Components/Recruiter/JobForm/ModalContext";
// import WebSocketTest from "./Components/Meeting/WebSocketConnectivityTest"; 

  
  // Pass Redux token to the hook - it will only schedule when token exists
import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
// import JobDescription from "./Components/Recruiter/JobDescriptionDetails";
import JobDescriptionDetails from "./Components/Recruiter/JobDescriptionDetails";
import CompletedInterviews from "./Components/Recruiter/Completed/CompletedInterview";
import CandidateProfile from "./Components/Recruiter/CandidateProfile";
import ReportPage from "./Components/Report/Detailed/DetailedReportPage";
// import CandidateLogin from "./Components/Auth/CandidateLogin";
function App() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  useAuthRefresh(accessToken);

  // useAuthRefresh(); // refresh token every 14 min

  const location = useLocation();
  // Pages where we don't want Navbar and Footer
  const LandingNavBar = location.pathname === "/heroSection";
  const auth = location.pathname === "/auth";
  const Meeting = location.pathname === "/Meet";
  // const MeetingPermissions = location.pathname === "/meetingPermissions";
  // const MeetSection = location.pathname === "/meetingSection";
  const userVerification = location.pathname === "/verify-notice"
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#29445D",
            color: "#fff",
            borderRadius: "10px",
            padding: "12px 16px",
          },
          success: {
            iconTheme: {
              primary: "#4CAF50",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#F44336",
              secondary: "#fff",
            },
          },
        }}
      />
       <ModalProvider>
         <SessionProvider>
      <div>
        {/* Conditionally render Navbar */}
        {LandingNavBar && <Navbar />}
        {!LandingNavBar && !userVerification && !auth && <TopBar />}

        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/heroSection" element={<HeroSection />} />
          <Route path="/common" element={<CommonPage />} />
          <Route path="/meetingSection" element={<MeetInterface />} />
          <Route path="/meetingPermissions" element={<MeetingPermissions />} />
          <Route path="/userDashboard" element={<Dashboard />} />
          <Route path="/Meet" element={<Meet />} />
          <Route path="/verify-notice" element={<VerificationNotice />} />
          <Route path="/ScheduledInterview" element={<ScheduledInterviews />} />
           <Route path="/CompletedInterview" element={<CompletedInterviews />} />
           <Route path="/job/:id" element={<JobDescriptionDetails />} />
           <Route path="/resume/:resumeId" element={<CandidateProfile />} />
          {/* <Route path="/WebTest" element={<WebSocketTest/>} /> */}
          <Route path="/report" element={<ReportPage />} />
          {/* <Route path="/login" element={<CandidateLogin />} /> */}

        </Routes>
        {/* Conditionally render Footer */}
        {!auth && !Meeting && !userVerification && <Footer />}
      </div>
      </SessionProvider>
    </ModalProvider>
    </>
  );
}


export default App;

// #29445D #D1DED3 #9CBFAC #719D99 #45767C
// skills_summary
// description in experience and project 
