import React, { useState } from 'react';
import { Menu, X, Sparkles, Users, Briefcase, Target, Zap, BarChart3, Shield, ArrowRight, CheckCircle, Star, TrendingUp, Clock, Award } from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Matching",
      description: "Smart algorithms connect the right talent with the right opportunities"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Screening",
      description: "Automated resume analysis and skill assessment in seconds"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Real-time insights into your hiring pipeline and candidate progress"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with full GDPR and data protection compliance"
    }
  ];

  const candidateFeatures = [
    "AI-optimized profile builder",
    "Intelligent job recommendations",
    "One-click applications",
    "Real-time application tracking",
    "Interview preparation tools",
    "Career growth insights"
  ];

  const recruiterFeatures = [
    "Automated candidate sourcing",
    "AI-powered skill matching",
    "Collaborative hiring tools",
    "Custom screening workflows",
    "Advanced analytics & reporting",
    "Seamless ATS integration"
  ];

  const stats = [
    { number: "50K+", label: "Active Candidates" },
    { number: "2,000+", label: "Companies Hiring" },
    { number: "95%", label: "Match Accuracy" },
    { number: "48hrs", label: "Avg. Time to Hire" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">IntelliHire</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition">Features</a>
              <a href="#for-candidates" className="text-gray-600 hover:text-blue-600 font-medium transition">For Candidates</a>
              <a href="#for-recruiters" className="text-gray-600 hover:text-blue-600 font-medium transition">For Recruiters</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition">Pricing</a>
              <button className="text-blue-600 hover:text-blue-700 font-semibold transition">Sign In</button>
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-blue-600 font-medium">Features</a>
              <a href="#for-candidates" className="block text-gray-600 hover:text-blue-600 font-medium">For Candidates</a>
              <a href="#for-recruiters" className="block text-gray-600 hover:text-blue-600 font-medium">For Recruiters</a>
              <a href="#" className="block text-gray-600 hover:text-blue-600 font-medium">Pricing</a>
              <button className="w-full text-left text-blue-600 font-semibold">Sign In</button>
              <button className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-gray-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
              <Star className="w-4 h-4 mr-2" />
              AI-Powered Technical Recruiting
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Connect Top Talent with
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"> Dream Jobs</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              The intelligent recruiting platform that uses AI to match candidates with opportunities, streamline hiring, and build exceptional teams faster than ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-xl hover:shadow-2xl flex items-center justify-center group">
                For Candidates
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition shadow-lg flex items-center justify-center group">
                For Recruiters
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powered by Advanced AI</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cutting-edge technology that transforms the recruiting experience for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition group">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Candidates Section */}
      <section id="for-candidates" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                <Users className="w-4 h-4 mr-2" />
                For Job Seekers
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Find Your Perfect Role</h2>
              <p className="text-lg text-gray-600 mb-8">
                Let AI do the heavy lifting. Get matched with opportunities that align with your skills, experience, and career goals.
              </p>
              <div className="space-y-4 mb-8">
                {candidateFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg inline-flex items-center group">
                Create Your Profile
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full"></div>
                    <div>
                      <div className="font-semibold text-gray-900">Your Profile</div>
                      <div className="text-sm text-gray-500">95% Complete</div>
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Senior Frontend Developer</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">95% Match</span>
                    </div>
                    <p className="text-sm text-gray-600">Tech Corp • Remote • $120K-$150K</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Full Stack Engineer</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">88% Match</span>
                    </div>
                    <p className="text-sm text-gray-600">StartupXYZ • Hybrid • $110K-$140K</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Recruiters Section */}
      <section id="for-recruiters" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Hiring Dashboard</h3>
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-3xl font-bold mb-1">247</div>
                    <div className="text-blue-100 text-sm">Active Candidates</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-3xl font-bold mb-1">18</div>
                    <div className="text-blue-100 text-sm">Open Positions</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Senior React Developer</div>
                      <div className="text-blue-100 text-sm flex items-center mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        5 top matches found
                      </div>
                    </div>
                    <div className="text-2xl">🎯</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">DevOps Engineer</div>
                      <div className="text-blue-100 text-sm flex items-center mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        3 interviews scheduled
                      </div>
                    </div>
                    <div className="text-2xl">✅</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold mb-4">
                <Briefcase className="w-4 h-4 mr-2" />
                For Hiring Teams
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Hire Smarter, Faster</h2>
              <p className="text-lg text-gray-600 mb-8">
                Transform your recruitment process with AI-powered tools that find, screen, and engage the best technical talent automatically.
              </p>
              <div className="space-y-4 mb-8">
                {recruiterFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg inline-flex items-center group">
                Start Hiring Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -ml-48"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of companies and candidates using TalentAI Pro to make better hiring decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition shadow-xl">
              Start Free Trial
            </button>
            <button className="bg-transparent text-white px-8 py-4 rounded-lg font-semibold border-2 border-white hover:bg-white/10 transition">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">TalentAI Pro</span>
              </div>
              <p className="text-sm">AI-powered recruiting for the modern workforce.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Candidates</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-white transition">Create Profile</a></li>
                <li><a href="#" className="hover:text-white transition">Career Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Recruiters</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Post a Job</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2024 TalentAI Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}