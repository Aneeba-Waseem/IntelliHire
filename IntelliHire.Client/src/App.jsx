import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from './Components/LandingPage';
import AuthPage from './Components/AuthPage';
import HRDashboard from './Components/HRDashboard';
import MeetingInterface from './Components/MeetingInterface';
import './App.css';

function App() {
  return (
    // <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth page */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Other routes (optional) */}
        <Route path="/dashboard" element={<HRDashboard />} />
        <Route path="/meeting" element={<MeetingInterface />} />
      </Routes>
    // </Router>
  );
}

export default App;
