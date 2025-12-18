import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, Users, Settings, Phone, Maximize, Volume2, VolumeX, MoreVertical, FileText, Sparkles, Clock, CheckCircle } from 'lucide-react';

export default function MeetingInterface() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'AI Assistant', text: 'Welcome to the interview! I\'ll be monitoring and taking notes.', time: '10:00 AM', isAI: true }
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: 'You',
        text: newMessage,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isAI: false
      }]);
      setNewMessage('');
    }
  };

  const aiInsights = [
    { icon: CheckCircle, text: 'Candidate demonstrates strong technical knowledge', color: 'green' },
    { icon: Sparkles, text: 'Good problem-solving approach observed', color: 'blue' },
    { icon: Clock, text: 'Response time: Average', color: 'gray' }
  ];

  const questions = [
    { id: 1, text: 'Explain the difference between REST and GraphQL APIs', status: 'completed', duration: '4:23' },
    { id: 2, text: 'Describe your experience with React hooks', status: 'completed', duration: '5:12' },
    { id: 3, text: 'How would you optimize a slow-loading React application?', status: 'current', duration: '2:45' },
    { id: 4, text: 'Explain asynchronous programming in JavaScript', status: 'pending', duration: '-' }
  ];

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold">IntelliHire</span>
          </div>
          <div className="h-6 w-px bg-gray-600"></div>
          <div className="text-white">
            <div className="text-sm font-medium">Interview: Sarah Johnson</div>
            <div className="text-xs text-gray-400">Senior React Developer</div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-white bg-red-600 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
          </div>
          <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
            {/* Candidate Video */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">SJ</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <span className="text-white text-sm font-medium">Sarah Johnson (Candidate)</span>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                <button className="p-2 bg-black bg-opacity-60 rounded-lg backdrop-blur-sm text-white hover:bg-opacity-80">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white text-xs">Active</span>
              </div>
            </div>

            {/* Your Video */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center">
                {isVideoOff ? (
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center">
                    <VideoOff className="w-12 h-12 text-gray-400" />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">HR</span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <span className="text-white text-sm font-medium">You (Interviewer)</span>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                <button className="p-2 bg-black bg-opacity-60 rounded-lg backdrop-blur-sm text-white hover:bg-opacity-80">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
              {isMuted && (
                <div className="absolute top-4 left-4">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <MicOff className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Screen Share Area */}
          {isScreenSharing && (
            <div className="h-48 bg-gray-800 rounded-xl mb-4 flex items-center justify-center border-2 border-blue-500">
              <div className="text-center">
                <Monitor className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <p className="text-white font-medium">Screen Sharing Active</p>
                <p className="text-gray-400 text-sm">Candidate's screen is visible</p>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-xl transition ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-4 rounded-xl transition ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`p-4 rounded-xl transition ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <Monitor className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                className={`p-4 rounded-xl transition ${showChat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                className={`p-4 rounded-xl transition ${showParticipants ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <Users className="w-5 h-5 text-white" />
              </button>
              <button className="p-4 rounded-xl bg-gray-700 hover:bg-gray-600 transition">
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
            </div>

            <button className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center space-x-2">
              <Phone className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">End Interview</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar - AI Notes & Chat */}
        <div className={`w-96 bg-gray-800 border-l border-gray-700 flex flex-col transition-all ${showChat || showParticipants ? 'block' : 'hidden lg:block'}`}>
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => { setShowNotes(true); setShowChat(false); setShowParticipants(false); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${showNotes ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              AI Notes
            </button>
            <button
              onClick={() => { setShowChat(true); setShowNotes(false); setShowParticipants(false); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${showChat ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Chat
            </button>
          </div>

          {/* AI Notes Panel */}
          {showNotes && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 rounded-lg border border-blue-700"> */}
                {/* <div className="flex items-center space-x-2 mb-3"> */}
                  {/* <Sparkles className="w-5 h-5 text-blue-400" /> */}
                  {/* <h3 className="text-white font-semibold">Live AI Insights</h3> */}
                {/* </div> */}
                {/* <div className="space-y-2">
                  {aiInsights.map((insight, i) => (
                    <div key={i} className="flex items-start space-x-2 text-sm">
                      <insight.icon className={`w-4 h-4 text-${insight.color}-400 mt-0.5 flex-shrink-0`} />
                      <span className="text-gray-300">{insight.text}</span>
                    </div>
                  ))}
                </div> */}
              {/* </div> */}

              <div>
                <h3 className="text-white font-semibold mb-3">Questions Asked</h3>
                <div className="space-y-2">
                  {questions.map(q => (
                    <div key={q.id} className={`p-3 rounded-lg border ${
                      q.status === 'completed' ? 'bg-gray-700 border-gray-600' :
                      q.status === 'current' ? 'bg-blue-900 border-blue-700' :
                      'bg-gray-800 border-gray-700'
                    }`}>
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          q.status === 'completed' ? 'bg-green-900 text-green-300' :
                          q.status === 'current' ? 'bg-blue-700 text-blue-200' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {q.status === 'completed' ? 'Completed' : q.status === 'current' ? 'In Progress' : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-400">{q.duration}</span>
                      </div>
                      <p className="text-sm text-gray-300">{q.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-3">Key Points</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Strong understanding of React fundamentals and hooks</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Demonstrated experience with state management (Redux)</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Good communication skills and problem-solving approach</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {showChat && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] ${msg.isAI ? 'bg-blue-900' : 'bg-gray-700'} rounded-lg p-3`}>
                      <div className="flex items-center space-x-2 mb-1">
                        {msg.isAI && <Sparkles className="w-3 h-3 text-blue-400" />}
                        <span className="text-xs font-medium text-gray-300">{msg.sender}</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-200">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                  >
                    <MessageSquare className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Participants Panel */}
          {showParticipants && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-white font-semibold mb-4">Participants (2)</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">SJ</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Sarah Johnson</div>
                      <div className="text-xs text-gray-400">Candidate</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-green-400" />
                    <Video className="w-4 h-4 text-green-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">HR</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">You</div>
                      <div className="text-xs text-gray-400">Interviewer</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-green-400" />}
                    {isVideoOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4 text-green-400" />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}