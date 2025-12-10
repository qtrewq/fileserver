import React, { useState, useEffect } from 'react';
import api from '../api';
import { User, Mail, Lock, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function AccountSettings({ onClose }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        newUsername: '',
        newEmail: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/users/me');
            setCurrentUser(response.data);
            setFormData(prev => ({
                ...prev,
                newUsername: response.data.username,
                newEmail: response.data.email || ''
            }));
        } catch (err) {
            setError('Failed to load user data');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate passwords match if changing password
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        // Check if current password is provided
        if (!formData.currentPassword) {
            setError('Current password is required to make changes');
            setLoading(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('current_password', formData.currentPassword);

            // Only include fields that changed
            if (formData.newUsername !== currentUser.username) {
                data.append('new_username', formData.newUsername);
            }
            if (formData.newEmail !== (currentUser.email || '')) {
                data.append('new_email', formData.newEmail);
            }
            if (formData.newPassword) {
                data.append('new_password', formData.newPassword);
            }

            const response = await api.put('/account/settings', data);

            // If username changed, update token
            if (response.data.username_changed) {
                localStorage.setItem('token', response.data.access_token);
            }

            setSuccess(response.data.message);

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));

            // Refresh user data
            await fetchCurrentUser();

            // Close modal after 2 seconds
            setTimeout(() => {
                if (onClose) onClose();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update account settings');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-400" />
                        Account Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-xl mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-400" />
                            Username
                        </label>
                        <input
                            type="text"
                            name="newUsername"
                            value={formData.newUsername}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter new username"
                            disabled={loading}
                        />
                        <p className="text-xs text-slate-500">Letters, numbers, and underscores only</p>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-green-400" />
                            Email
                        </label>
                        <input
                            type="email"
                            name="newEmail"
                            value={formData.newEmail}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter new email"
                            disabled={loading}
                        />
                        <p className="text-xs text-slate-500">Used for password reset</p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                    </div>

                    {/* Current Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-purple-400" />
                            Current Password *
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter current password"
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-slate-500">Required to save any changes</p>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-pink-400" />
                            New Password (optional)
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Enter new password"
                            disabled={loading}
                        />
                        <p className="text-xs text-slate-500">Leave blank to keep current password</p>
                    </div>

                    {/* Confirm New Password */}
                    {formData.newPassword && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-pink-400" />
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Confirm new password"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="btn-secondary px-6 py-3"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
