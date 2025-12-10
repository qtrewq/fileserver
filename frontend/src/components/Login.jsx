import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, User, Server, ArrowRight, Shield, Mail, CheckCircle } from 'lucide-react';

export default function Login() {
    const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'reset'
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Reset Password Token
    const [resetToken, setResetToken] = useState('');

    // UI state
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        try {
            const queryParams = new URLSearchParams(window.location.search);
            const token = queryParams.get('token');
            if (token) {
                setResetToken(token);
                setMode('reset');
            }
        } catch (e) {
            console.error("Error parsing URL params:", e);
        }
    }, []);

    const handleLogin = async (e) => {
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
            if (err.response?.status === 403) {
                navigate('/account-disabled');
                return;
            }
            if (err.response?.status === 423) {
                setError(err.response?.data?.detail || 'Account is temporarily locked.');
                return;
            }
            if (err.response?.status === 429) {
                setError(err.response?.data?.detail || 'Too many login attempts. Please try again later.');
                return;
            }
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);

            const response = await api.post('/register', formData);
            localStorage.setItem('token', response.data.access_token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('email', email);

            const response = await api.post('/forgot-password', formData);
            setSuccess(response.data.message);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('token', resetToken);
            formData.append('new_password', password);

            await api.post('/reset-password', formData);
            setSuccess('Password reset successfully. Please login.');
            setMode('login');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        if (mode === 'login') handleLogin(e);
        else if (mode === 'register') handleRegister(e);
        else if (mode === 'forgot') handleForgotPassword(e);
        else if (mode === 'reset') handleResetPasswordSubmit(e);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
    };

    // Helper to get UI text based on mode
    const getUIConfig = () => {
        switch (mode) {
            case 'login':
                return {
                    title: 'Welcome Back',
                    subtitle: 'Secure File Management System',
                    button: loading ? 'Signing in...' : 'Sign In',
                    showUsername: true,
                    showEmail: false,
                    showPassword: true,
                    showConfirm: false,
                    showForgot: true
                };
            case 'register':
                return {
                    title: 'Create Account',
                    subtitle: 'Join your secure workspace',
                    button: loading ? 'Creating account...' : 'Create Account',
                    showUsername: true,
                    showEmail: true,
                    showPassword: true,
                    showConfirm: true,
                    showForgot: false
                };
            case 'forgot':
                return {
                    title: 'Reset Password',
                    subtitle: 'Enter your email to reset password',
                    button: loading ? 'Sending link...' : 'Send Reset Link',
                    showUsername: false,
                    showEmail: true,
                    showPassword: false,
                    showConfirm: false,
                    showForgot: false
                };
            case 'reset':
                return {
                    title: 'Set New Password',
                    subtitle: 'Enter your new password below',
                    button: loading ? 'Resetting...' : 'Set New Password',
                    showUsername: false,
                    showEmail: false,
                    showPassword: true,
                    showConfirm: true,
                    showForgot: false
                };
            default:
                return { title: '', subtitle: '', button: '', showUsername: false };
        }
    };

    const ui = getUIConfig();

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
                            {ui.title}
                        </h1>
                        <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            {ui.subtitle}
                        </p>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm animate-slide-up">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                                {error}
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-xl mb-6 text-sm backdrop-blur-sm animate-slide-up">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {success}
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Field */}
                        {ui.showUsername && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-400" />
                                    {mode === 'login' ? 'Username or Email' : 'Username'}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="input-field relative"
                                        placeholder={mode === 'login' ? 'Enter username or email' : 'Enter your username'}
                                        required
                                        disabled={loading}
                                    />
                                    {mode === 'register' && (
                                        <div className="absolute right-3 top-3 text-xs text-slate-500 pointer-events-none">
                                            {username && `/users/${username}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        {ui.showEmail && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-green-400" />
                                    Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field relative"
                                        placeholder="Enter your email"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password Field */}
                        {ui.showPassword && (
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
                                    {mode === 'register' && (
                                        <p className="text-xs text-slate-500 mt-1 ml-1">Min 8 chars, 1 uppercase, 1 special</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Confirm Password Field */}
                        {ui.showConfirm && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-pink-400" />
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-field relative"
                                        placeholder="Confirm your password"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Forgot Password Link */}
                        {ui.showForgot && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => switchMode('forgot')}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 active:scale-95 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-6"
                        >
                            {loading && (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            )}
                            {!loading && ui.button}
                            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    {/* Switcher */}
                    <div className="mt-6 text-center border-t border-white/10 pt-4">
                        {mode === 'login' ? (
                            <p className="text-sm text-slate-400">
                                Don't have an account?{' '}
                                <button onClick={() => switchMode('register')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    Sign Up
                                </button>
                            </p>
                        ) : mode === 'reset' ? (
                            <p className="text-sm text-slate-400">
                                <button onClick={() => switchMode('login')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    Back to Login
                                </button>
                            </p>
                        ) : (
                            <p className="text-sm text-slate-400">
                                Already have an account?{' '}
                                <button onClick={() => switchMode('login')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    Sign In
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600">
                        Powered by FastAPI & React
                    </p>
                </div>
            </div>
        </div>
    );
}
