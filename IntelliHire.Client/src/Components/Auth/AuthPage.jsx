import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <div className="relative w-full max-w-6xl flex shadow-2xl rounded-2xl overflow-hidden bg-white">
                {/* Left Branding Panel */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-12 flex-col justify-between text-white relative overflow-hidden">
                    {/* Branding content here... */}
                </div>

                {/* Right Auth Panel */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
                    <div className="w-full max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                {isLogin ? "Welcome Back" : "Get Started"}
                            </h2>
                            <p className="text-gray-600">
                                {isLogin ? "Sign in to your recruiter account" : "Create your recruiter account"}
                            </p>
                        </div>

                        {isLogin ? <LoginForm /> : <SignUpForm />}

                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    {isLogin ? "Sign Up" : "Sign In"}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
