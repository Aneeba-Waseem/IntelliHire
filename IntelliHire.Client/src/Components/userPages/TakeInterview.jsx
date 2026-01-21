import React from 'react';

const TakeInterview = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#D1DED3' }}>
  {/* Header */}
  <header className="w-full flex justify-between items-center px-8 py-4" style={{ backgroundColor: '#29445D', color: '#D1DED3' }}>
    <h1 className="text-2xl font-bold">AI Interview Platform</h1>
    <div className="flex items-center gap-4">
      <span>Hi, User</span>
      <img src="/avatar.png" alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-[#9CBFAC]" />
    </div>
  </header>

  {/* Main Content */}
  <main className="flex flex-col items-center justify-center flex-1 px-4">
    {/* Greeting */}
    <div className="text-center mb-6">
      <h2 className="text-3xl font-semibold text-[#45767C] mb-2">Welcome, User!</h2>
      <p className="text-[#719D99] text-lg">
        Your AI interview is ready. Make sure your camera and microphone are on.
      </p>
    </div>

    {/* Checklist */}
    <div className="w-full max-w-md bg-[#29445D] text-[#D1DED3] rounded-xl p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Before you start:</h3>
      <ul className="space-y-2 list-disc list-inside">
        <li>Check camera and microphone</li>
        <li>Quiet and well-lit environment</li>
        <li>Have your resume ready</li>
        <li>Estimated time: 20–30 minutes</li>
      </ul>
    </div>

    {/* AI Tip / Avatar */}
    <div className="flex flex-col items-center mb-6">
      <div className="w-24 h-24 rounded-full bg-[#9CBFAC] flex items-center justify-center text-[#29445D] font-bold text-lg mb-2">
        AI
      </div>
      <p className="text-[#45767C] text-center max-w-xs">
        Tip: Speak clearly, take your time, and answer confidently.
      </p>
    </div>

    {/* Start Button */}
    <button
      className="px-12 py-4 rounded-full font-semibold text-[#D1DED3] text-lg hover:scale-105 transition transform"
      style={{ backgroundColor: '#719D99' }}
    >
      Start Interview
    </button>

    {/* Optional Setup Button */}
    <button
      className="mt-4 text-[#29445D] underline"
    >
      Test Your Camera & Mic
    </button>
  </main>
</div>

);
}

export default TakeInterview;
