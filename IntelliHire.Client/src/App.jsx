import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AuthPage from './Components/AuthPage'
import LandingPage from './Components/LandingPage'
import HRDashboard from './Components/HRDashboard'
import MeetingInterface from './Components/MeetingInterface'
import { Routes, Route, Link } from "react-router-dom"

function App() {
  return (
   <div>
    {/* <MeetingInterface/> */}
    {/* <HRDashboard/> */}
    {/* <LandingPage/> */}
    <AuthPage />
   </div>
  )
}

export default App
