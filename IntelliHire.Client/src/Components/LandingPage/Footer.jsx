import { SparklesIcon } from '@heroicons/react/24/outline';
import React from 'react';


export default function Footer() {
  return (  
<footer className="bg-[#3A4E51] text-[#D1DED3] py-12 px-4 sm:px-6  lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
              
                <span className="text-lg font-bold text-[#D1DED3]">IntelliHire</span>
              </div>
              <p className="text-sm">AI-powered recruiting for the modern workforce.</p>
            </div>
            <div>
              <h4 className="text-[#D1DED3] font-semibold mb-4">For Candidates</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-white transition">Create Profile</a></li>
                <li><a href="#" className="hover:text-white transition">Career Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#D1DED3] font-semibold mb-4">For Recruiters</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Post a Job</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#D1DED3] font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 IntelliHire. All rights reserved.</p>
          </div>
        </div>
      </footer>
  )};