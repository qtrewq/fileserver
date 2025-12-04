import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, UserPlus, Trash2, Shield, User, Key, Edit2, Check, X, Users, FolderPlus } from 'lucide-react';

export default function Admin() {
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', root_path: '/', require_password_change: false, groups: [] });
    const [newGroup, setNewGroup] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [editUsername, setEditUsername] = useState('');
    const [editRootPath, setEditRootPath] = useState('');
    const [editRequirePasswordChange, setEditRequirePasswordChange] = useState(false);
    const [editIsDisabled, setEditIsDisabled] = useState(false);
    const [editGroups, setEditGroups] = useState([]);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    // Group permission editing state
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupPermissions, setGroupPermissions] = useState({
        description: '',
        default_permission: 'read',
        can_upload: true,
        can_download: true,
        can_delete: false,
        can_share: false,
        can_create_folders: true,
        restrict_to_folders: false,
        folder_permissions: []
    });
    const [newFolderPath, setNewFolderPath] = useState('');
    const [newFolderPermission, setNewFolderPermission] = useState('read');

    useEffect(() => {
        fetchCurrentUser();
        fetchUsers();
        fetchGroups();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/users/me');
            setCurrentUser(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups/');
            setGroups(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', newUser);
            setNewUser({ username: '', password: '', root_path: '/', require_password_change: false, groups: [] });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to create user');
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroup.trim()) return;
        try {
            await api.post('/groups/', { name: newGroup });
            setNewGroup('');
            fetchGroups();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to create group');
        }
    };

    const handleDelete = async (username) => {
        if (!confirm(`Delete user ${username}?`)) return;
        try {
            await api.delete(`/users/${username}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleDeleteGroup = async (groupName) => {
        if (!confirm(`Delete group ${groupName}?`)) return;
        try {
            await api.delete(`/groups/${encodeURIComponent(groupName)}/`);
            fetchGroups();
        } catch (err) {
            alert('Failed to delete group');
        }
    };

    const handleUpdateUser = async (oldUsername) => {
        if (!editUsername.trim()) {
            return;
        }

        try {
            await api.put(`/users/${oldUsername}`, {
                username: editUsername,
                root_path: editRootPath,
                require_password_change: editRequirePasswordChange,
                is_disabled: editIsDisabled,
                groups: editGroups
            });
            setEditingUser(null);
            setEditUsername('');
            setEditRootPath('');
            setEditGroups([]);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to update user');
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim()) {
            alert('Please enter a new password');
            return;
        }

        try {
            await api.post(`/users/${resetPasswordUser}/reset-password`, { new_password: newPassword });
            setResetPasswordUser(null);
            setNewPassword('');
            alert('Password reset successfully');
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to reset password');
        }
    };

    const handleEditGroup = async (groupName) => {
        try {
            const res = await api.get(`/groups/${encodeURIComponent(groupName)}/`);
            setEditingGroup(groupName);
            setGroupPermissions({
                description: res.data.description || '',
                default_permission: res.data.default_permission || 'read',
                can_upload: res.data.can_upload !== undefined ? res.data.can_upload : true,
                can_download: res.data.can_download !== undefined ? res.data.can_download : true,
                can_delete: res.data.can_delete !== undefined ? res.data.can_delete : false,
                can_share: res.data.can_share !== undefined ? res.data.can_share : false,
                can_create_folders: res.data.can_create_folders !== undefined ? res.data.can_create_folders : true,
                restrict_to_folders: res.data.restrict_to_folders !== undefined ? res.data.restrict_to_folders : false,
                max_storage_quota: res.data.max_storage_quota || '',
                allowed_file_types: res.data.allowed_file_types || '',
                folder_permissions: res.data.folder_permissions || []
            });
        } catch (err) {
            console.error('Error loading group details:', err);
            console.error('Error response:', err.response);
            alert(`Failed to load group details: ${err.response?.data?.detail || err.message}`);
        }
    };

    const handleUpdateGroupPermissions = async () => {
        try {
            const payload = {
                ...groupPermissions,
                max_storage_quota: groupPermissions.max_storage_quota ? parseInt(groupPermissions.max_storage_quota) : null,
                allowed_file_types: groupPermissions.allowed_file_types || null
            };
            await api.put(`/groups/${encodeURIComponent(editingGroup)}/`, payload);
            setEditingGroup(null);
            fetchGroups();
            alert('Group permissions updated successfully');
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to update group permissions');
        }
    };

    const handleAddFolderPermission = () => {
        if (!newFolderPath.trim()) return;

        setGroupPermissions({
            ...groupPermissions,
            folder_permissions: [
                ...groupPermissions.folder_permissions,
                { folder_path: newFolderPath, permission: newFolderPermission }
            ]
        });
        setNewFolderPath('');
        setNewFolderPermission('read');
    };

    const handleRemoveFolderPermission = (index) => {
        setGroupPermissions({
            ...groupPermissions,
            folder_permissions: groupPermissions.folder_permissions.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="min-h-screen p-4 md:p-8 w-full mx-auto pb-20 md:pb-8">
            <div className="flex items-center mb-6 md:mb-8">
                <Link to="/" className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-white">User & Group Management</h1>
            </div>

            {/* Password Reset Modal */}
            {resetPasswordUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setResetPasswordUser(null)}>
                    <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Key className="w-6 h-6 text-yellow-500" />
                            Reset Password for "{resetPasswordUser}"
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                                    className="input-field"
                                    placeholder="Enter new password"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleResetPassword} className="btn-primary flex-1 py-3">
                                Reset Password
                            </button>
                            <button onClick={() => setResetPasswordUser(null)} className="btn-secondary flex-1 py-3">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Permission Editor Modal */}
            {editingGroup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setEditingGroup(null)}>
                    <div className="bg-slate-900 rounded-xl p-6 max-w-4xl w-full shadow-2xl border border-white/10 my-8" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-green-500" />
                            Edit Group Permissions: "{editingGroup}"
                        </h3>

                        <div className="space-y-6">
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                                <input
                                    type="text"
                                    value={groupPermissions.description}
                                    onChange={(e) => setGroupPermissions({ ...groupPermissions, description: e.target.value })}
                                    className="input-field"
                                    placeholder="Optional group description"
                                />
                            </div>

                            {/* Default Permission Level */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Default Permission Level</label>
                                <select
                                    value={groupPermissions.default_permission}
                                    onChange={(e) => setGroupPermissions({ ...groupPermissions, default_permission: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="none">None - No Access</option>
                                    <option value="read">Read - View & Download Only</option>
                                    <option value="write">Write - Full Access</option>
                                    <option value="admin">Admin - Full Control</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Base permission level for all files/folders</p>
                            </div>

                            {/* Granular Permissions */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">Granular Permissions</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-800/50 p-4 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="can_upload"
                                            checked={groupPermissions.can_upload}
                                            onChange={(e) => setGroupPermissions({ ...groupPermissions, can_upload: e.target.checked })}
                                            className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                        />
                                        <label htmlFor="can_upload" className="text-sm text-slate-300">Can Upload Files</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="can_download"
                                            checked={groupPermissions.can_download}
                                            onChange={(e) => setGroupPermissions({ ...groupPermissions, can_download: e.target.checked })}
                                            className="rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500"
                                        />
                                        <label htmlFor="can_download" className="text-sm text-slate-300">Can Download Files</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="can_delete"
                                            checked={groupPermissions.can_delete}
                                            onChange={(e) => setGroupPermissions({ ...groupPermissions, can_delete: e.target.checked })}
                                            className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500"
                                        />
                                        <label htmlFor="can_delete" className="text-sm text-slate-300">Can Delete Files/Folders</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="can_share"
                                            checked={groupPermissions.can_share}
                                            onChange={(e) => setGroupPermissions({ ...groupPermissions, can_share: e.target.checked })}
                                            className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                                        />
                                        <label htmlFor="can_share" className="text-sm text-slate-300">Can Share with Others</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="can_create_folders"
                                            checked={groupPermissions.can_create_folders}
                                            onChange={(e) => setGroupPermissions({ ...groupPermissions, can_create_folders: e.target.checked })}
                                            className="rounded border-slate-600 bg-slate-700 text-yellow-500 focus:ring-yellow-500"
                                        />
                                        <label htmlFor="can_create_folders" className="text-sm text-slate-300">Can Create Folders</label>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Max Storage Quota (Bytes)</label>
                                    <input
                                        type="number"
                                        value={groupPermissions.max_storage_quota}
                                        onChange={(e) => setGroupPermissions({ ...groupPermissions, max_storage_quota: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g. 1073741824 (1GB) - Leave empty for unlimited"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Allowed File Types</label>
                                    <input
                                        type="text"
                                        value={groupPermissions.allowed_file_types}
                                        onChange={(e) => setGroupPermissions({ ...groupPermissions, allowed_file_types: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g. .jpg,.png,.pdf - Leave empty for all"
                                    />
                                </div>
                            </div>

                            {/* Folder Restrictions */}
                            <div>
                                <div className="flex items-center space-x-2 mb-3">
                                    <input
                                        type="checkbox"
                                        id="restrict_to_folders"
                                        checked={groupPermissions.restrict_to_folders}
                                        onChange={(e) => setGroupPermissions({ ...groupPermissions, restrict_to_folders: e.target.checked })}
                                        className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                                    />
                                    <label htmlFor="restrict_to_folders" className="text-sm font-medium text-slate-300">
                                        Restrict to Specific Folders Only
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">
                                    When enabled, group members can ONLY access the folders listed below (plus any individually shared folders)
                                </p>

                                {groupPermissions.restrict_to_folders && (
                                    <div className="bg-slate-800/50 p-4 rounded-lg space-y-4">
                                        {/* Add Folder Permission */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newFolderPath}
                                                onChange={(e) => setNewFolderPath(e.target.value)}
                                                className="input-field flex-1"
                                                placeholder="/path/to/folder"
                                            />
                                            <select
                                                value={newFolderPermission}
                                                onChange={(e) => setNewFolderPermission(e.target.value)}
                                                className="input-field w-32"
                                            >
                                                <option value="none">None</option>
                                                <option value="read">Read</option>
                                                <option value="write">Write</option>
                                            </select>
                                            <button
                                                onClick={handleAddFolderPermission}
                                                className="btn-primary px-4"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {/* Folder Permission List */}
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {groupPermissions.folder_permissions.length === 0 ? (
                                                <p className="text-slate-500 text-sm italic text-center py-4">No folder restrictions set</p>
                                            ) : (
                                                groupPermissions.folder_permissions.map((fp, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-slate-700/50 p-3 rounded border border-slate-600">
                                                        <div className="flex-1">
                                                            <p className="text-slate-200 font-mono text-sm">{fp.folder_path}</p>
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                Permission: <span className={`font-semibold ${fp.permission === 'write' ? 'text-green-400' :
                                                                    fp.permission === 'read' ? 'text-blue-400' : 'text-red-400'
                                                                    }`}>{fp.permission}</span>
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveFolderPermission(index)}
                                                            className="text-slate-400 hover:text-red-400 transition-colors ml-3"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-8">
                            <button onClick={handleUpdateGroupPermissions} className="btn-primary flex-1 py-3">
                                <Check className="w-5 h-5 inline mr-2" />
                                Save Permissions
                            </button>
                            <button onClick={() => setEditingGroup(null)} className="btn-secondary flex-1 py-3">
                                <X className="w-5 h-5 inline mr-2" />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div >
            )
            }

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Create User & Create Group */}
                <div className="xl:col-span-3 space-y-8">
                    {/* Create User Form */}
                    <div className="glass-card h-fit p-4 md:p-6">
                        <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                            <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
                            Create User
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Root Path</label>
                                <input
                                    type="text"
                                    value={newUser.root_path}
                                    onChange={(e) => setNewUser({ ...newUser, root_path: e.target.value })}
                                    className="input-field"
                                    placeholder="/"
                                />
                                <p className="text-xs text-slate-500 mt-1">Relative to storage root</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Groups</label>
                                <div className="flex flex-col gap-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
                                    {groups.length === 0 ? (
                                        <span className="text-slate-500 text-xs italic p-1">No groups available</span>
                                    ) : (
                                        groups.map(g => {
                                            const isSelected = newUser.groups.includes(g.name);
                                            return (
                                                <label key={g.id} className="flex items-center space-x-2 p-1.5 hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            const newGroups = isSelected
                                                                ? newUser.groups.filter(name => name !== g.name)
                                                                : [...newUser.groups, g.name];
                                                            setNewUser({ ...newUser, groups: newGroups });
                                                        }}
                                                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <span className={`text-sm ${isSelected ? 'text-blue-300 font-medium' : 'text-slate-300'}`}>
                                                        {g.name}
                                                    </span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Select groups from the list</p>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="require_password_change"
                                        checked={newUser.require_password_change}
                                        onChange={(e) => setNewUser({ ...newUser, require_password_change: e.target.checked })}
                                        className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                                    />
                                    <label htmlFor="require_password_change" className="text-sm text-slate-300">Require Password Change</label>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full py-3">
                                Create User
                            </button>
                        </form>
                    </div>

                    {/* Create Group Form */}
                    <div className="glass-card h-fit p-4 md:p-6">
                        <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                            <FolderPlus className="w-5 h-5 mr-2 text-green-500" />
                            Create Group
                        </h2>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Group Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newGroup}
                                        onChange={(e) => setNewGroup(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g., Students"
                                        required
                                    />
                                    <button type="submit" className="btn-primary px-4">
                                        Add
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-slate-400 mb-3">Existing Groups</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {groups.length === 0 ? (
                                    <p className="text-slate-600 text-sm italic">No groups created yet</p>
                                ) : (
                                    groups.map(group => (
                                        <div key={group.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                                            <div className="flex-1">
                                                <span className="text-slate-300 text-sm font-medium">{group.name}</span>
                                                {group.description && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEditGroup(group.name)}
                                                    className="text-slate-500 hover:text-blue-400 transition-colors p-1"
                                                    title="Edit permissions"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGroup(group.name)}
                                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                                    title="Delete group"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: User List */}
                <div className="xl:col-span-9 glass-card p-6 md:p-8">
                    <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        Users
                    </h2>
                    <div className="overflow-x-auto -mx-6 md:mx-0">
                        <table className="w-full text-left min-w-[900px] md:min-w-0">
                            <thead>
                                <tr className="border-b border-white/10 text-slate-400 text-sm font-medium">
                                    <th className="pb-4 pl-6 w-1/6">Username</th>
                                    <th className="pb-4 px-4 w-1/6">Root Path</th>
                                    <th className="pb-4 px-4 w-1/5">Groups</th>
                                    <th className="pb-4 px-4 w-1/5">Role</th>
                                    <th className="pb-4 pr-6 text-right w-1/8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((u) => (
                                    <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-5 pl-6">
                                            {editingUser === u.username ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editUsername}
                                                        onChange={(e) => setEditUsername(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateUser(u.username)}
                                                        className="input-field py-1 px-2 text-sm w-24 md:w-auto"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateUser(u.username)}
                                                        className="p-1 hover:bg-green-500/20 rounded text-green-400"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUser(null)}
                                                        className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white">{u.username}</span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(u.username);
                                                            setEditUsername(u.username);
                                                            setEditRootPath(u.root_path);
                                                            setEditRequirePasswordChange(u.require_password_change || false);
                                                            setEditIsDisabled(u.is_disabled || false);
                                                            setEditGroups(u.groups ? u.groups.map(g => g.name) : []);
                                                        }}
                                                        className="md:opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-500/20 rounded text-blue-400 transition-opacity"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 px-4 text-slate-400 font-mono text-sm">
                                            {editingUser === u.username ? (
                                                <input
                                                    type="text"
                                                    value={editRootPath}
                                                    onChange={(e) => setEditRootPath(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleUpdateUser(u.username)}
                                                    className="input-field py-1 px-2 text-sm w-full"
                                                />
                                            ) : (
                                                u.root_path
                                            )}
                                        </td>
                                        <td className="py-4 text-slate-400 text-sm">
                                            {editingUser === u.username ? (
                                                <div className="flex flex-col gap-1 min-w-[200px] p-1 max-h-40 overflow-y-auto bg-slate-800/50 rounded border border-slate-700">
                                                    {groups.map(g => {
                                                        const isSelected = editGroups.includes(g.name);
                                                        return (
                                                            <label key={g.id} className="flex items-center space-x-2 p-1 hover:bg-white/5 rounded cursor-pointer transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        const newGroups = isSelected
                                                                            ? editGroups.filter(name => name !== g.name)
                                                                            : [...editGroups, g.name];
                                                                        setEditGroups(newGroups);
                                                                    }}
                                                                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 h-3 w-3"
                                                                />
                                                                <span className={`text-xs ${isSelected ? 'text-blue-300 font-medium' : 'text-slate-300'}`}>
                                                                    {g.name}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {u.groups && u.groups.length > 0 ? (
                                                        u.groups.map(g => (
                                                            <span key={g.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                                                                {g.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-600 italic">-</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 px-4">
                                            {editingUser === u.username && currentUser?.is_super_admin ? (
                                                <div className="flex flex-col gap-1">
                                                    <label className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editRequirePasswordChange}
                                                            onChange={(e) => setEditRequirePasswordChange(e.target.checked)}
                                                            className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                                                        />
                                                        <span className="text-xs text-slate-300">Require Password Change</span>
                                                    </label>
                                                    <label className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editIsDisabled}
                                                            onChange={(e) => setEditIsDisabled(e.target.checked)}
                                                            className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500"
                                                        />
                                                        <span className="text-xs text-slate-300">Account Disabled</span>
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {u.groups && u.groups.some(g => g.name === 'super_admins') && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                            <Shield className="w-3 h-3 mr-1" /> Super Admin
                                                        </span>
                                                    )}
                                                    {u.groups && u.groups.some(g => g.name === 'admins') && !u.groups.some(g => g.name === 'super_admins') && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            <Shield className="w-3 h-3 mr-1" /> Admin
                                                        </span>
                                                    )}
                                                    {(!u.groups || (!u.groups.some(g => g.name === 'admins') && !u.groups.some(g => g.name === 'super_admins'))) && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                            User
                                                        </span>
                                                    )}
                                                    {u.is_disabled && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                                            DISABLED
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 pr-6">
                                            <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setResetPasswordUser(u.username)}
                                                    className="p-2 hover:bg-yellow-500/20 rounded-lg text-slate-500 hover:text-yellow-400 transition-colors"
                                                    title="Reset Password"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u.username)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
}
