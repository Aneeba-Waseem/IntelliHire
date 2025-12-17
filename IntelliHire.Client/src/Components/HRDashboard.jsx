import React, { useState } from 'react';
import { Calendar, Video, BarChart3, Users, Clock, TrendingUp, Search, Filter, Plus, Eye, Download, CheckCircle, XCircle, AlertCircle, Sparkles, Menu, Bell, Settings, LogOut, Home, FileText } from 'lucide-react';

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const upcomingInterviews = [
    { id: 1, candidate: 'Sarah Johnson', position: 'Senior React Developer', date: '2024-12-15', time: '10:00 AM' },
    { id: 2, candidate: 'Michael Chen', position: 'Full Stack Engineer', date: '2024-12-15', time: '02:00 PM' },
    { id: 3, candidate: 'Emily Davis', position: 'DevOps Engineer', date: '2024-12-16', time: '11:00 AM' }
  ];

  const completedInterviews = [
    { id: 4, candidate: 'Alex Martinez', position: 'Backend Developer', date: '2024-12-10', duration: '45 min', score: 85, technicalScore: 88, communicationScore: 82, problemSolvingScore: 87, recommendation: 'Highly Recommended' },
    { id: 5, candidate: 'Jessica Brown', position: 'Frontend Developer', date: '2024-12-09', duration: '40 min', score: 72, technicalScore: 75, communicationScore: 70, problemSolvingScore: 71, recommendation: 'Consider for Junior Role' },
    { id: 6, candidate: 'David Kim', position: 'ML Engineer', date: '2024-12-08', duration: '50 min', score: 92, technicalScore: 95, communicationScore: 88, problemSolvingScore: 93, recommendation: 'Excellent Candidate' }
  ];

  const stats = [
    { label: 'Total Interviews', value: '127', change: '+12%', icon: Users, color: 'blue' },
    { label: 'Scheduled Today', value: '3', change: '+2', icon: Calendar, color: 'green' },
    { label: 'Avg. Success Rate', value: '78%', change: '+5%', icon: TrendingUp, color: 'purple' },
    { label: 'Pending Reviews', value: '8', change: '-3', icon: FileText, color: 'orange' }
  ];

  const ReportModal = ({ interview, onClose }) => {
    if (!interview) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Performance Report</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{interview.candidate.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{interview.candidate}</h3>
                  <p className="text-gray-600">{interview.position}</p>
                  <p className="text-sm text-gray-500 mt-1">{interview.date} • {interview.duration}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{interview.score}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Score Breakdown</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Technical Skills</div>
                  <div className="text-2xl font-bold mb-2">{interview.technicalScore}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: `${interview.technicalScore}%`}}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Communication</div>
                  <div className="text-2xl font-bold mb-2">{interview.communicationScore}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: `${interview.communicationScore}%`}}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Problem Solving</div>
                  <div className="text-2xl font-bold mb-2">{interview.problemSolvingScore}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: `${interview.problemSolvingScore}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-bold mb-2">AI Recommendation</h3>
                  <p className="text-gray-700 font-medium mb-2">{interview.recommendation}</p>
                  <p className="text-sm text-gray-600">Strong technical knowledge and excellent problem-solving abilities. Clear communication skills. Would be a great fit for the team.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </button>
              <button className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50">Share</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all flex flex-col`}>
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && <span className="text-lg font-bold">IntelliHire</span>}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', icon: Home, label: 'Overview' },
            { id: 'schedule', icon: Calendar, label: 'Schedule' },
            { id: 'interviews', icon: Users, label: 'Interviews' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span>Settings</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 hover:text-gray-900">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">HR</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 border hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                      </div>
                      <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{stat.change}</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Upcoming Interviews</h2>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />Schedule New
                  </button>
                </div>
                <div className="space-y-4">
                  {upcomingInterviews.map(int => (
                    <div key={int.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{int.candidate.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div>
                          <div className="font-semibold">{int.candidate}</div>
                          <div className="text-sm text-gray-600">{int.position}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm font-medium">{int.date}</div>
                          <div className="text-sm text-gray-600">{int.time}</div>
                        </div>
                        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          <Video className="w-4 h-4 mr-2" />Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold mb-6">Schedule New Interview</h2>
              <div className="max-w-2xl space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
                    <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Position" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input type="time" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="candidate@email.com" />
                </div>
                <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Schedule Interview</button>
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">All Interviews</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4 mr-2" />Filter
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {completedInterviews.map(int => (
                      <tr key={int.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-semibold text-sm">{int.candidate.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <span className="font-medium">{int.candidate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{int.position}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{int.date}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${int.score >= 80 ? 'text-green-600' : int.score >= 60 ? 'text-blue-600' : 'text-orange-600'}`}>{int.score}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => setSelectedInterview(int)} className="text-blue-600 hover:text-blue-700 font-medium">View Report</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-bold mb-4">Interview Success Rate</h3>
                <div className="space-y-3">
                  {[{label: 'Excellent (80-100)', value: 35, color: 'green'}, {label: 'Good (60-79)', value: 45, color: 'blue'}, {label: 'Average (40-59)', value: 20, color: 'orange'}].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold">{item.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`bg-${item.color}-500 h-2 rounded-full`} style={{width: `${item.value}%`}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[{text: 'Interview completed', sub: 'David Kim - ML Engineer', time: '2 hours ago', color: 'green'}, {text: 'Interview scheduled', sub: 'Sarah Johnson - React Dev', time: '5 hours ago', color: 'blue'}].map((item, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 bg-${item.color}-500 rounded-full mt-2`}></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.text}</div>
                        <div className="text-xs text-gray-600">{item.sub}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {selectedInterview && <ReportModal interview={selectedInterview} onClose={() => setSelectedInterview(null)} />}
    </div>
  );
}