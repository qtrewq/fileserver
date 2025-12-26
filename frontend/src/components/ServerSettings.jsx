import { useState, useEffect } from 'react';
import api from '../api';
import { Settings, Shield, HardDrive, Zap, AlertTriangle, Mail } from 'lucide-react';

const ServerSettings = () => {
    const [config, setConfig] = useState(null);
    const [serverInfo, setServerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('server');

    useEffect(() => {
        fetchConfig();
        fetchServerInfo();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get('/config');
            setConfig(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching config:', error);
            setMessage({ type: 'error', text: 'Failed to load configuration' });
            setLoading(false);
        }
    };

    const fetchServerInfo = async () => {
        try {
            const response = await api.get('/server/info');
            setServerInfo(response.data);
        } catch (error) {
            console.error('Error fetching server info:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const response = await api.put('/config', config);

            setMessage({
                type: 'success',
                text: response.data.message || 'Configuration saved successfully. Please restart the server for changes to take effect.'
            });

            // Refresh server info
            fetchServerInfo();
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Failed to save configuration'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const response = await api.post('/config/reset', {});

            setConfig(response.data.config);
            setMessage({
                type: 'success',
                text: 'Configuration reset to defaults. Please restart the server.'
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Failed to reset configuration'
            });
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (section, key, value) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    if (loading) {
        return <div className="text-center p-8 text-slate-400 animate-pulse">Loading configuration...</div>;
    }

    if (!config) {
        return <div className="text-center p-8 text-red-500">Failed to load configuration</div>;
    }

    const tabs = [
        { id: 'server', label: 'Server', icon: Settings },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'storage', label: 'Storage', icon: HardDrive },
        { id: 'features', label: 'Features', icon: Zap },
        { id: 'limits', label: 'Limits', icon: AlertTriangle },
        { id: 'email', label: 'Email', icon: Mail },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <h2 className="text-xl md:text-2xl font-bold text-white">Server Settings</h2>
                {serverInfo && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-white/5 text-sm">
                        <span className="text-slate-400">Version: <span className="text-white font-mono">{serverInfo.version}</span></span>
                        <span className="text-white/10">|</span>
                        <span className="text-slate-400">Active Connections: <span className="text-blue-400 font-mono">{serverInfo.active_websocket_connections}</span></span>
                    </div>
                )}
            </div>

            {message && (
                <div className={`p-4 rounded-lg border ${message.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="flex flex-wrap gap-2 pb-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="glass-card p-6 md:p-8 min-h-[400px]">
                {activeTab === 'server' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Server Configuration</h3>
                            <p className="text-sm text-slate-400">Configure server network settings. Requires restart to apply.</p>
                        </div>

                        <div className="grid gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Port</label>
                                <input
                                    type="number"
                                    value={config.server.port}
                                    onChange={(e) => updateConfig('server', 'port', parseInt(e.target.value))}
                                    min="1"
                                    max="65535"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Server port (1-65535). Default: 30815</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Host</label>
                                <input
                                    type="text"
                                    value={config.server.host}
                                    onChange={(e) => updateConfig('server', 'host', e.target.value)}
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Server host address. Use 0.0.0.0 for all interfaces</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Public URL</label>
                                <input
                                    type="text"
                                    value={config.server.public_url || ''}
                                    onChange={(e) => updateConfig('server', 'public_url', e.target.value)}
                                    placeholder="https://files.aqueous.lol"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Public facing URL for email links</p>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                <input
                                    type="checkbox"
                                    checked={config.server.reload}
                                    onChange={(e) => updateConfig('server', 'reload', e.target.checked)}
                                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 w-4 h-4"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-200">Auto-reload on code changes</span>
                                    <p className="text-xs text-slate-500">Enable for development only</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Security Settings</h3>
                            <p className="text-sm text-slate-400">Configure security and upload limits.</p>
                        </div>

                        <div className="grid gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Max File Size (MB)</label>
                                <input
                                    type="number"
                                    value={config.security.max_file_size_mb}
                                    onChange={(e) => updateConfig('security', 'max_file_size_mb', parseInt(e.target.value))}
                                    min="1"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maximum size for individual file uploads</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Max Total Upload Size (MB)</label>
                                <input
                                    type="number"
                                    value={config.security.max_total_upload_size_mb}
                                    onChange={(e) => updateConfig('security', 'max_total_upload_size_mb', parseInt(e.target.value))}
                                    min="1"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maximum total size for batch uploads</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Allowed Origins</label>
                                <input
                                    type="text"
                                    value={config.security.allowed_origins}
                                    onChange={(e) => updateConfig('security', 'allowed_origins', e.target.value)}
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">CORS allowed origins (comma-separated or * for all)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Session Timeout (minutes)</label>
                                <input
                                    type="number"
                                    value={config.security.session_timeout_minutes}
                                    onChange={(e) => updateConfig('security', 'session_timeout_minutes', parseInt(e.target.value))}
                                    min="1"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">User session timeout duration</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'storage' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Storage Settings</h3>
                            <p className="text-sm text-slate-400">Configure file storage location.</p>
                        </div>

                        <div className="grid gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Storage Root Path</label>
                                <input
                                    type="text"
                                    value={config.storage.root_path}
                                    onChange={(e) => updateConfig('storage', 'root_path', e.target.value)}
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Root directory for file storage. Requires restart.</p>
                            </div>

                            {serverInfo && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-sm text-blue-400">
                                        <strong className="font-semibold text-blue-300">Current Storage Root:</strong> {serverInfo.storage_root}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Feature Toggles</h3>
                            <p className="text-sm text-slate-400">Enable or disable server features.</p>
                        </div>

                        <div className="grid gap-4 max-w-2xl">
                            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={config.features.enable_file_sharing}
                                    onChange={(e) => updateConfig('features', 'enable_file_sharing', e.target.checked)}
                                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 w-5 h-5"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-200 block">Enable File Sharing</span>
                                    <span className="text-xs text-slate-500">Allow users to share files and folders</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={config.features.enable_collaborative_editing}
                                    onChange={(e) => updateConfig('features', 'enable_collaborative_editing', e.target.checked)}
                                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 w-5 h-5"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-200 block">Enable Collaborative Editing</span>
                                    <span className="text-xs text-slate-500">Allow real-time collaborative file editing</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={config.features.enable_python_execution}
                                    onChange={(e) => updateConfig('features', 'enable_python_execution', e.target.checked)}
                                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 w-5 h-5"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-200 block">Enable Python Execution</span>
                                    <span className="text-xs text-slate-500">Allow execution of Python scripts (security risk)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'limits' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">System Limits</h3>
                            <p className="text-sm text-slate-400">Configure system resource limits.</p>
                        </div>

                        <div className="grid gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Max Users</label>
                                <input
                                    type="number"
                                    value={config.limits.max_users}
                                    onChange={(e) => updateConfig('limits', 'max_users', parseInt(e.target.value))}
                                    min="1"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maximum number of user accounts</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Max Groups</label>
                                <input
                                    type="number"
                                    value={config.limits.max_groups}
                                    onChange={(e) => updateConfig('limits', 'max_groups', parseInt(e.target.value))}
                                    min="1"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maximum number of user groups</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Max Concurrent Connections</label>
                                <input
                                    type="number"
                                    value={config.limits.max_concurrent_connections}
                                    onChange={(e) => updateConfig('limits', 'max_concurrent_connections', parseInt(e.target.value))}
                                    min="1"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maximum simultaneous WebSocket connections</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Max Files in Folder Upload</label>
                                <input
                                    type="number"
                                    value={config.limits.max_folder_upload_files || 1000}
                                    onChange={(e) => updateConfig('limits', 'max_folder_upload_files', parseInt(e.target.value))}
                                    min="1"
                                    className="input-field"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maximum number of files allowed in a single batch upload</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Email Configuration</h3>
                            <p className="text-sm text-slate-400">Configure SMTP settings for outgoing emails.</p>
                        </div>

                        <div className="grid gap-6 max-w-2xl">
                            <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                <input
                                    type="checkbox"
                                    checked={config.smtp?.enabled || false}
                                    onChange={(e) => updateConfig('smtp', 'enabled', e.target.checked)}
                                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 w-4 h-4"
                                />
                                <span className="text-sm font-medium text-slate-200">Enable Email Sending</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Delivery Method</label>
                                <select
                                    value={config.smtp?.mode || 'relay'}
                                    onChange={(e) => updateConfig('smtp', 'mode', e.target.value)}
                                    className="input-field"
                                >
                                    <option value="relay">SMTP Relay (Custom)</option>
                                    <option value="gmail">Gmail (Easiest)</option>
                                    <option value="direct">Direct Delivery (No Account)</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Select the method to send emails</p>
                            </div>

                            {config.smtp?.mode === 'gmail' && (
                                <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Gmail Address</label>
                                        <input
                                            type="text"
                                            value={config.smtp?.username || ''}
                                            onChange={(e) => updateConfig('smtp', 'username', e.target.value)}
                                            placeholder="user@gmail.com"
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">App Password</label>
                                        <input
                                            type="password"
                                            value={config.smtp?.password || ''}
                                            onChange={(e) => updateConfig('smtp', 'password', e.target.value)}
                                            placeholder="Generate in Google Account > Security"
                                            className="input-field"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">This is NOT your login password. Use an App Password.</p>
                                    </div>
                                </div>
                            )}

                            {(!config.smtp?.mode || config.smtp?.mode === 'relay') && (
                                <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">SMTP Host</label>
                                            <input
                                                type="text"
                                                value={config.smtp?.host || ''}
                                                onChange={(e) => updateConfig('smtp', 'host', e.target.value)}
                                                placeholder="smtp.example.com"
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">SMTP Port</label>
                                            <input
                                                type="number"
                                                value={config.smtp?.port || ''}
                                                onChange={(e) => updateConfig('smtp', 'port', parseInt(e.target.value) || 0)}
                                                placeholder="587"
                                                className="input-field"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={config.smtp?.username || ''}
                                            onChange={(e) => updateConfig('smtp', 'username', e.target.value)}
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={config.smtp?.password || ''}
                                            onChange={(e) => updateConfig('smtp', 'password', e.target.value)}
                                            className="input-field"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={config.smtp?.use_tls || false}
                                            onChange={(e) => updateConfig('smtp', 'use_tls', e.target.checked)}
                                            className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 w-4 h-4"
                                        />
                                        <span className="text-sm text-slate-300">Use TLS</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">From Email</label>
                                <input
                                    type="text"
                                    value={config.smtp?.from_email || ''}
                                    onChange={(e) => updateConfig('smtp', 'from_email', e.target.value)}
                                    placeholder="noreply@aqueous.lol"
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    className="btn-danger"
                    onClick={handleReset}
                    disabled={saving}
                >
                    Reset to Defaults
                </button>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            <div className="p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg">
                <p className="text-orange-200 text-sm">
                    <strong className="font-bold text-orange-400 block mb-1">Important:</strong>
                    Most configuration changes require a server restart to take effect.
                </p>
            </div>
        </div>
    );
};

export default ServerSettings;
