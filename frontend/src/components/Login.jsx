import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, User, Server, ArrowRight, Shield } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/token', formData);
            localStorage.setItem('token', response.data.access_token);
            navigate('/');
        } catch (err) {
            // Check if account is disabled (403 error)
            if (err.response?.status === 403) {
                navigate('/account-disabled');
                return;
            }

            // Check for account lockout (423 error)
            if (err.response?.status === 423) {
                setError(err.response?.data?.detail || 'Account is temporarily locked.');
                return;
            }

            // Check for rate limiting (429 error)
            if (err.response?.status === 429) {
                setError(err.response?.data?.detail || 'Too many login attempts. Please try again later.');
                return;
            }

            // Display error message from server or generic message
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background gradients */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Login card */}
            <div className="relative w-full max-w-md">
                {/* Decorative elements */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>

                <div className="glass-card relative overflow-hidden animate-fade-in">
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                    {/* Header */}
                    <div className="text-center mb-8 pt-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/50">
                            <Server className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            FileServer
                        </h1>
                        <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            Secure File Management System
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm animate-slide-up">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-400" />
                                Username
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input-field relative"
                                    placeholder="Enter your username"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-purple-400" />
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field relative"
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 active:scale-95 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-6"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Bottom decorative text */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600">
                        Powered by FastAPI & React
                    </p>
                </div>
            </div>
        </div>
    );
}
