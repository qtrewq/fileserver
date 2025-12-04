import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff, Home, Mail } from 'lucide-react';

export default function AccountDisabled() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="max-w-md w-full">
                <div className="glass-card p-8 text-center">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/30">
                            <ShieldOff className="w-10 h-10 text-red-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Account Disabled
                    </h1>

                    {/* Message */}
                    <p className="text-slate-300 mb-6 leading-relaxed">
                        Your account has been disabled by an administrator. You no longer have access to this system.
                    </p>

                    {/* Details */}
                    <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
                        <h2 className="text-sm font-semibold text-slate-400 mb-3">What this means:</h2>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li className="flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                <span>You cannot log in to your account</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                <span>You cannot access any files or folders</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                <span>All active sessions have been terminated</span>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-left">
                                <h3 className="text-sm font-semibold text-blue-300 mb-1">
                                    Need Help?
                                </h3>
                                <p className="text-xs text-slate-400">
                                    If you believe this is an error, please contact your system administrator for assistance.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/"
                            className="btn-secondary flex items-center justify-center gap-2 py-3"
                        >
                            <Home className="w-4 h-4" />
                            Return to Login
                        </Link>
                    </div>

                    {/* Footer */}
                    <p className="text-xs text-slate-600 mt-6">
                        If you have questions about your account status, please reach out to your administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}
