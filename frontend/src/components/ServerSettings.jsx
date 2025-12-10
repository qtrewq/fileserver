import { useState, useEffect } from 'react';
import api from '../api';
import './ServerSettings.css';

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
        return <div className="server-settings-loading">Loading configuration...</div>;
    }

    if (!config) {
        return <div className="server-settings-error">Failed to load configuration</div>;
    }

    return (
        <div className="server-settings">
            <div className="server-settings-header">
                <h2>Server Settings</h2>
                {serverInfo && (
                    <div className="server-info-badge">
                        <span className="info-label">Version:</span> {serverInfo.version}
                        <span className="info-separator">|</span>
                        <span className="info-label">Active Connections:</span> {serverInfo.active_websocket_connections}
                    </div>
                )}
            </div>

            {message && (
                <div className={`settings-message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="settings-tabs">
                <button
                    className={activeTab === 'server' ? 'active' : ''}
                    onClick={() => setActiveTab('server')}
                >
                    Server
                </button>
                <button
                    className={activeTab === 'security' ? 'active' : ''}
                    onClick={() => setActiveTab('security')}
                >
                    Security
                </button>
                <button
                    className={activeTab === 'storage' ? 'active' : ''}
                    onClick={() => setActiveTab('storage')}
                >
                    Storage
                </button>
                <button
                    className={activeTab === 'features' ? 'active' : ''}
                    onClick={() => setActiveTab('features')}
                >
                    Features
                </button>
                <button
                    className={activeTab === 'limits' ? 'active' : ''}
                    onClick={() => setActiveTab('limits')}
                >
                    Limits
                </button>
                <button
                    className={activeTab === 'email' ? 'active' : ''}
                    onClick={() => setActiveTab('email')}
                >
                    Email
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'server' && (
                    <div className="settings-section">
                        <h3>Server Configuration</h3>
                        <p className="section-description">Configure server network settings. Requires restart to apply.</p>

                        <div className="setting-item">
                            <label>Port</label>
                            <input
                                type="number"
                                value={config.server.port}
                                onChange={(e) => updateConfig('server', 'port', parseInt(e.target.value))}
                                min="1"
                                max="65535"
                            />
                            <span className="setting-help">Server port (1-65535). Default: 30815</span>
                        </div>

                        <div className="setting-item">
                            <label>Host</label>
                            <input
                                type="text"
                                value={config.server.host}
                                onChange={(e) => updateConfig('server', 'host', e.target.value)}
                            />
                            <span className="setting-help">Server host address. Use 0.0.0.0 for all interfaces</span>
                        </div>

                        <div className="setting-item">
                            <label>Public URL</label>
                            <input
                                type="text"
                                value={config.server.public_url || ''}
                                onChange={(e) => updateConfig('server', 'public_url', e.target.value)}
                                placeholder="https://files.aqueous.lol"
                            />
                            <span className="setting-help">Public facing URL for email links</span>
                        </div>

                        <div className="setting-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config.server.reload}
                                    onChange={(e) => updateConfig('server', 'reload', e.target.checked)}
                                />
                                Auto-reload on code changes
                            </label>
                            <span className="setting-help">Enable for development only</span>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="settings-section">
                        <h3>Security Settings</h3>
                        <p className="section-description">Configure security and upload limits.</p>

                        <div className="setting-item">
                            <label>Max File Size (MB)</label>
                            <input
                                type="number"
                                value={config.security.max_file_size_mb}
                                onChange={(e) => updateConfig('security', 'max_file_size_mb', parseInt(e.target.value))}
                                min="1"
                            />
                            <span className="setting-help">Maximum size for individual file uploads</span>
                        </div>

                        <div className="setting-item">
                            <label>Max Total Upload Size (MB)</label>
                            <input
                                type="number"
                                value={config.security.max_total_upload_size_mb}
                                onChange={(e) => updateConfig('security', 'max_total_upload_size_mb', parseInt(e.target.value))}
                                min="1"
                            />
                            <span className="setting-help">Maximum total size for batch uploads</span>
                        </div>

                        <div className="setting-item">
                            <label>Allowed Origins</label>
                            <input
                                type="text"
                                value={config.security.allowed_origins}
                                onChange={(e) => updateConfig('security', 'allowed_origins', e.target.value)}
                            />
                            <span className="setting-help">CORS allowed origins (comma-separated or * for all)</span>
                        </div>

                        <div className="setting-item">
                            <label>Session Timeout (minutes)</label>
                            <input
                                type="number"
                                value={config.security.session_timeout_minutes}
                                onChange={(e) => updateConfig('security', 'session_timeout_minutes', parseInt(e.target.value))}
                                min="1"
                            />
                            <span className="setting-help">User session timeout duration</span>
                        </div>
                    </div>
                )}

                {activeTab === 'storage' && (
                    <div className="settings-section">
                        <h3>Storage Settings</h3>
                        <p className="section-description">Configure file storage location.</p>

                        <div className="setting-item">
                            <label>Storage Root Path</label>
                            <input
                                type="text"
                                value={config.storage.root_path}
                                onChange={(e) => updateConfig('storage', 'root_path', e.target.value)}
                            />
                            <span className="setting-help">Root directory for file storage. Requires restart.</span>
                        </div>

                        {serverInfo && (
                            <div className="info-box">
                                <strong>Current Storage Root:</strong> {serverInfo.storage_root}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="settings-section">
                        <h3>Feature Toggles</h3>
                        <p className="section-description">Enable or disable server features.</p>

                        <div className="setting-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config.features.enable_file_sharing}
                                    onChange={(e) => updateConfig('features', 'enable_file_sharing', e.target.checked)}
                                />
                                Enable File Sharing
                            </label>
                            <span className="setting-help">Allow users to share files and folders</span>
                        </div>

                        <div className="setting-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config.features.enable_collaborative_editing}
                                    onChange={(e) => updateConfig('features', 'enable_collaborative_editing', e.target.checked)}
                                />
                                Enable Collaborative Editing
                            </label>
                            <span className="setting-help">Allow real-time collaborative file editing</span>
                        </div>

                        <div className="setting-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config.features.enable_python_execution}
                                    onChange={(e) => updateConfig('features', 'enable_python_execution', e.target.checked)}
                                />
                                Enable Python Execution
                            </label>
                            <span className="setting-help">Allow execution of Python scripts (security risk)</span>
                        </div>
                    </div>
                )}

                {activeTab === 'limits' && (
                    <div className="settings-section">
                        <h3>System Limits</h3>
                        <p className="section-description">Configure system resource limits.</p>

                        <div className="setting-item">
                            <label>Max Users</label>
                            <input
                                type="number"
                                value={config.limits.max_users}
                                onChange={(e) => updateConfig('limits', 'max_users', parseInt(e.target.value))}
                                min="1"
                            />
                            <span className="setting-help">Maximum number of user accounts</span>
                        </div>

                        <div className="setting-item">
                            <label>Max Groups</label>
                            <input
                                type="number"
                                value={config.limits.max_groups}
                                onChange={(e) => updateConfig('limits', 'max_groups', parseInt(e.target.value))}
                                min="1"
                            />
                            <span className="setting-help">Maximum number of user groups</span>
                        </div>

                        <div className="setting-item">
                            <label>Max Concurrent Connections</label>
                            <input
                                type="number"
                                value={config.limits.max_concurrent_connections}
                                onChange={(e) => updateConfig('limits', 'max_concurrent_connections', parseInt(e.target.value))}
                                min="1"
                            />
                            <span className="setting-help">Maximum simultaneous WebSocket connections</span>
                        </div>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="settings-section">
                        <h3>Email Configuration</h3>
                        <p className="section-description">Configure SMTP settings for outgoing emails.</p>

                        <div className="setting-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config.smtp?.enabled || false}
                                    onChange={(e) => updateConfig('smtp', 'enabled', e.target.checked)}
                                />
                                Enable Email Sending
                            </label>
                        </div>

                        <div className="setting-item">
                            <label>Delivery Method</label>
                            <select
                                value={config.smtp?.mode || 'relay'}
                                onChange={(e) => updateConfig('smtp', 'mode', e.target.value)}
                                className="smtp-mode-select"
                            >
                                <option value="relay">SMTP Relay (Custom)</option>
                                <option value="gmail">Gmail (Easiest)</option>
                                <option value="direct">Direct Delivery (No Account)</option>
                            </select>
                            <span className="setting-help">Select the method to send emails</span>
                        </div>

                        {config.smtp?.mode === 'gmail' && (
                            <>
                                <div className="setting-item">
                                    <label>Gmail Address</label>
                                    <input
                                        type="text"
                                        value={config.smtp?.username || ''}
                                        onChange={(e) => updateConfig('smtp', 'username', e.target.value)}
                                        placeholder="user@gmail.com"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label>App Password</label>
                                    <input
                                        type="password"
                                        value={config.smtp?.password || ''}
                                        onChange={(e) => updateConfig('smtp', 'password', e.target.value)}
                                        placeholder="Generate in Google Account > Security"
                                    />
                                    <span className="setting-help">This is NOT your login password. Use an App Password.</span>
                                </div>
                            </>
                        )}

                        {(!config.smtp?.mode || config.smtp?.mode === 'relay') && (
                            <>
                                <div className="setting-item">
                                    <label>SMTP Host</label>
                                    <input
                                        type="text"
                                        value={config.smtp?.host || ''}
                                        onChange={(e) => updateConfig('smtp', 'host', e.target.value)}
                                        placeholder="smtp.example.com"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label>SMTP Port</label>
                                    <input
                                        type="number"
                                        value={config.smtp?.port || ''}
                                        onChange={(e) => updateConfig('smtp', 'port', parseInt(e.target.value) || 0)}
                                        placeholder="587"
                                    />
                                </div>

                                <div className="setting-item">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={config.smtp?.username || ''}
                                        onChange={(e) => updateConfig('smtp', 'username', e.target.value)}
                                    />
                                </div>

                                <div className="setting-item">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={config.smtp?.password || ''}
                                        onChange={(e) => updateConfig('smtp', 'password', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="setting-item">
                            <label>From Email</label>
                            <input
                                type="text"
                                value={config.smtp?.from_email || ''}
                                onChange={(e) => updateConfig('smtp', 'from_email', e.target.value)}
                                placeholder="noreply@aqueous.lol"
                            />
                        </div>

                        {(!config.smtp?.mode || config.smtp?.mode === 'relay') && (
                            <div className="setting-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={config.smtp?.use_tls || false}
                                        onChange={(e) => updateConfig('smtp', 'use_tls', e.target.checked)}
                                    />
                                    Use TLS
                                </label>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="settings-actions">
                <button
                    className="btn-save"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                    className="btn-reset"
                    onClick={handleReset}
                    disabled={saving}
                >
                    Reset to Defaults
                </button>
            </div>

            <div className="restart-notice">
                <strong>⚠️ Important:</strong> Most configuration changes require a server restart to take effect.
            </div>
        </div>
    );
};

export default ServerSettings;
