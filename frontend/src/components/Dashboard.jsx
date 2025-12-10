import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import CodeEditor from './CodeEditor';
import AccountSettings from './AccountSettings';
import {
    Folder, File, FileText, Image as ImageIcon, Music, Video,
    Download, Trash2, Upload, Home, LogOut, Settings, ChevronRight,
    RefreshCw, X, FolderPlus, Share2, Users, Check, Key, Menu, Grid3x3, List, LayoutGrid, Edit, Save, Play, Terminal, FolderUp,
    ArrowUpDown, ArrowUp, ArrowDown, User
} from 'lucide-react';

export default function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showShareModal, setShowShareModal] = useState(null);
    const [shareUsername, setShareUsername] = useState('');
    const [sharePermission, setSharePermission] = useState('read');
    const [users, setUsers] = useState([]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [viewMode, setViewMode] = useState('home'); // 'home', 'shared', or 'user:<username>'
    const [sharedItems, setSharedItems] = useState([]);
    const [showNavMenu, setShowNavMenu] = useState(false);
    const [viewType, setViewType] = useState(localStorage.getItem('viewType') || 'grid'); // 'grid' or 'list'
    const [viewSize, setViewSize] = useState(localStorage.getItem('viewSize') || 'medium'); // 'small', 'medium', 'large'
    const [showEditor, setShowEditor] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [editorFile, setEditorFile] = useState(null);
    const [editorFilePath, setEditorFilePath] = useState(''); // Full path to the file being edited
    const [editorSaving, setEditorSaving] = useState(false);
    const socketRef = useRef(null); // Use ref for socket
    const [activeUsers, setActiveUsers] = useState([]);
    const [pythonOutput, setPythonOutput] = useState('');
    const [pythonRunning, setPythonRunning] = useState(false);
    const [showPythonOutput, setShowPythonOutput] = useState(false);
    const [pythonSessionId, setPythonSessionId] = useState(null);
    const [sortBy, setSortBy] = useState(localStorage.getItem('sortBy') || 'name'); // 'name', 'size', 'date', 'type'
    const [sortOrder, setSortOrder] = useState(localStorage.getItem('sortOrder') || 'asc'); // 'asc' or 'desc'
    const [showAccountSettings, setShowAccountSettings] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryPassword, setRecoveryPassword] = useState('');

    const currentPath = location.pathname.substring(1);


    useEffect(() => {
        fetchUser();
        fetchItems();
        fetchUsers();
    }, [currentPath, viewMode]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 's' && showEditor) {
                e.preventDefault();
                handleSaveFile();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showEditor, editorContent, editorFile]);

    // Check if user needs to change password
    useEffect(() => {
        if (user) {
            if (user.require_password_change) {
                setShowPasswordModal(true);
            } else if (user.is_super_admin && !user.email) {
                setShowEmailModal(true);
            }
        }
    }, [user]);

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        if (!user?.is_admin) return;
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSharedItems = async () => {
        try {
            const res = await api.get('/shared-with-me');
            setSharedItems(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            if (viewMode === 'shared') {
                // Show folders/files shared with the current user
                const res = await api.get('/shared-with-me');
                const shared = res.data;
                setSharedItems(shared);
                setItems(shared.map(share => ({
                    name: share.folder_path.split('/').pop(),
                    is_dir: !share.is_file,
                    size: 0,
                    path: share.folder_path,
                    shared: true,
                    permission: share.permission,
                    owner: share.owner_username
                })));
            } else {
                const path = currentPath || '';
                const res = await api.get(`/files/${path}`);

                if (Array.isArray(res.data)) {
                    setItems(res.data);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const path = currentPath || '';
            await api.post(`/upload/${path}`, formData);
            fetchItems();
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (itemName) => {
        if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;
        try {
            const path = currentPath ? `${currentPath}/${itemName}` : itemName;
            await api.delete(`/files/${path}`);
            fetchItems();
            alert('Deleted successfully');
        } catch (err) {
            alert(err.response?.data?.detail || 'Delete failed');
        }
    };

    const handleDownload = async (itemName) => {
        try {
            const path = currentPath ? `${currentPath}/${itemName}` : itemName;
            const response = await api.get(`/files/${path}`, { responseType: 'blob' });

            // Create a blob URL and trigger download
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = itemName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Download failed');
        }
    };

    const handlePreview = async (item) => {
        const ext = item.name.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isCode = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'py', 'css', 'html', 'xml', 'yaml', 'yml', 'sh', 'bash', 'sql', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(ext);

        if (isImage || isCode) {
            try {
                const path = currentPath ? `${currentPath}/${item.name}` : item.name;

                if (isCode) {
                    const response = await api.get(`/files/${path}`, { responseType: 'text' });
                    setPreviewItem({ ...item, content: response.data, type: 'code' });
                } else {
                    const response = await api.get(`/files/${path}`, { responseType: 'blob' });
                    const blob = new Blob([response.data]);
                    const url = window.URL.createObjectURL(blob);
                    setPreviewItem({ ...item, blobUrl: url, type: 'image' });
                }
            } catch (err) {
                console.error(err);
                alert('Failed to load preview');
            }
        } else {
            handleDownload(item.name);
        }
    };

    const closePreview = () => {
        if (previewItem?.blobUrl) {
            window.URL.revokeObjectURL(previewItem.blobUrl);
        }
        setPreviewItem(null);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const path = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
            await api.post(`/mkdir/${path}`);
            setShowNewFolderModal(false);
            setNewFolderName('');
            fetchItems();
        } catch (err) {
            alert('Failed to create folder');
        }
    };

    const handleShare = async () => {
        if (!shareUsername.trim()) return;

        try {
            const itemPath = currentPath ? `${currentPath}/${showShareModal.name}` : showShareModal.name;
            const isFile = !showShareModal.is_dir;

            await api.post('/share', {
                folder_path: itemPath,
                username: shareUsername,
                permission: sharePermission,
                is_file: isFile
            });
            setShowShareModal(null);
            setShareUsername('');
            setSharePermission('read');
            alert(`${isFile ? 'File' : 'Folder'} shared with ${shareUsername}`);
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to share');
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            await api.post('/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            alert('Password changed successfully');
            // Refresh user data to clear require_password_change flag
            await fetchUser();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to change password');
        }
    };

    const handleFileUpload = async (event) => {
        console.log('handleFileUpload called', event.target.files);
        const files = Array.from(event.target.files);
        if (files.length === 0) {
            console.log('No files selected');
            return;
        }

        console.log(`Uploading ${files.length} file(s)`);
        setUploading(true);
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            console.log('Sending upload request to:', `/upload/${currentPath || ''}`);
            await api.post(`/upload/${currentPath || ''}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            fetchItems();
            alert(`Successfully uploaded ${files.length} file(s)`);
        } catch (err) {
            console.error('Upload error:', err);
            alert(err.response?.data?.detail || 'Failed to upload files');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFolderUpload = async (event) => {
        console.log('handleFolderUpload called', event.target.files);
        const files = Array.from(event.target.files);
        if (files.length === 0) {
            console.log('No files selected for folder upload');
            return;
        }
        console.log(`Uploading folder with ${files.length} file(s)`);
        setUploading(true);
        try {
            const formData = new FormData();
            // For folder uploads, preserve the relative path structure
            files.forEach(file => {
                // webkitRelativePath contains the folder structure
                const relativePath = file.webkitRelativePath || file.name;
                console.log('Adding file to upload:', relativePath);

                // Append the file with the relative path as the third parameter (filename)
                formData.append('files', file, relativePath);
            });
            console.log('Sending folder upload request to:', `/upload/${currentPath || ''}`);
            await api.post(`/upload/${currentPath || ''}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            fetchItems();
            const folderName = files[0].webkitRelativePath?.split('/')[0] || 'folder';
            alert(`Successfully uploaded folder "${folderName}" with ${files.length} file(s)`);
        } catch (err) {
            console.error('Folder upload error:', err);
            console.error('Error response:', err.response?.data);
            alert(err.response?.data?.detail || 'Failed to upload folder');
        } finally {
            setUploading(false);
            if (folderInputRef.current) {
                folderInputRef.current.value = '';
            }
        }
    };

    const isEditable = (item) => {
        if (item.is_dir) return false;
        const ext = item.name.split('.').pop().toLowerCase();
        return ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'py', 'css', 'html', 'xml', 'yaml', 'yml', 'sh', 'bash', 'sql', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(ext);
    };

    const getFileLanguage = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'md': 'markdown',
            'txt': 'plaintext',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sh': 'shell',
            'bash': 'shell',
            'sql': 'sql',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin'
        };
        return languageMap[ext] || 'plaintext';
    };

    const [cursors, setCursors] = useState([]);

    const USER_COLORS = [
        '#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5', '#F5FF33',
        '#FF8C33', '#8C33FF', '#33FF8C', '#FF3333', '#33FFFF', '#FFFF33'
    ];

    const getUserColor = (username) => {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % USER_COLORS.length;
        return USER_COLORS[index];
    };

    // Manage WebSocket connection
    useEffect(() => {
        if (!showEditor || !editorFilePath || !user) {
            return;
        }

        const token = localStorage.getItem('token');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/${editorFilePath}?token=${token}`;

        console.log('Connecting WS to', wsUrl);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to collaboration room');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'users_update') {
                    setActiveUsers(data.users);
                } else if (data.type === 'cursor_update') {
                    if (data.username !== user.username) { // Use user instead of currentUser
                        setCursors(prev => {
                            const otherCursors = prev.filter(c => c.username !== data.username);
                            return [...otherCursors, {
                                username: data.username,
                                position: data.position,
                                color: getUserColor(data.username)
                            }];
                        });
                    }
                } else if (data.type === 'content_update') {
                    console.log('WS Received content:', data.content);
                    setEditorContent(prev => {
                        if (data.content !== prev) {
                            return data.content;
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.error('WS Parse error', e);
            }
        };

        ws.onclose = (e) => {
            console.log('WS Closed:', e.code, e.reason);
        };

        ws.onerror = (e) => {
            console.error('WS Error:', e);
        };

        return () => {
            ws.close();
            socketRef.current = null;
            setActiveUsers([]);
            setCursors([]);
        };
    }, [showEditor, editorFilePath]);

    // Cleanup Python environment when editor closes
    useEffect(() => {
        if (!showEditor && pythonSessionId) {
            handleCleanupPython();
        }
    }, [showEditor, pythonSessionId]);

    // Filter cursors when active users change
    useEffect(() => {
        setCursors(prev => prev.filter(c => activeUsers.includes(c.username)));
    }, [activeUsers]);

    const handleCursorChange = (position) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: 'cursor_update',
                username: user.username, // Use user instead of currentUser
                position: position
            }));
        }
    };

    const handleEditFile = async (item) => {
        if (!isEditable(item)) {
            alert('This file type cannot be edited');
            return;
        }

        try {
            const path = item.shared ? item.path : (currentPath ? `${currentPath}/${item.name}` : item.name);
            // Add cache busting to prevent loading stale content
            const response = await api.get(`/files/${path}?_=${Date.now()}`, { responseType: 'text' });
            setEditorContent(response.data);
            setEditorFile(item);
            setEditorFilePath(path);
            setShowEditor(true);
        } catch (err) {
            alert('Failed to load file for editing');
            console.error(err);
        }
    };

    const saveFileInternal = async (silent = false) => {
        if (!editorFile) return;

        setEditorSaving(true);
        try {
            // Use new save-file endpoint
            const formData = new FormData();
            formData.append('file_path', editorFilePath);
            formData.append('content', editorContent);

            await api.post('/save-file', formData);

            if (!silent) {
                setShowEditor(false);
                setEditorContent('');
                setEditorFile(null);
                setEditorFilePath('');
                fetchItems();
                alert('File saved successfully');
            }
        } catch (err) {
            console.error('Save error:', err);
            if (!silent) {
                alert(`Failed to save file: ${err.response?.data?.detail || err.message}`);
            }
        } finally {
            setEditorSaving(false);
        }
    };

    const handleSaveFile = () => saveFileInternal(false);

    // Autosave Effect
    useEffect(() => {
        if (!showEditor || !editorFile) return;

        const timer = setTimeout(() => {
            saveFileInternal(true);
        }, 1000); // Autosave after 1 second of inactivity

        return () => clearTimeout(timer);
    }, [editorContent, showEditor, editorFile]);

    const handleRunPython = async () => {
        if (!editorFile || !editorFile.name.endsWith('.py')) return;

        console.log('Running Python file:', editorFile.name);
        setPythonRunning(true);
        setPythonOutput('Running...\n');
        setShowPythonOutput(true);

        // Generate or reuse session ID
        const sessionId = pythonSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!pythonSessionId) {
            setPythonSessionId(sessionId);
        }

        console.log('Session ID:', sessionId);

        try {
            console.log('Sending Python run request...');
            const response = await api.post('/python/run', {
                content: editorContent,
                session_id: sessionId,
                file_name: editorFile.name,
                path: currentPath || ''
            });

            console.log('Python run response:', response.data);

            let output = '';
            if (response.data.stdout) {
                output += response.data.stdout;
            }
            if (response.data.stderr) {
                output += '\n' + response.data.stderr;
            }
            if (!output) {
                output = response.data.success ? 'Program completed successfully with no output.' : 'Program failed.';
            }
            output += `\n\nExit code: ${response.data.returncode}`;

            console.log('Setting Python output:', output);
            setPythonOutput(output);
        } catch (err) {
            console.error('Python run error:', err);
            setPythonOutput(`Error: ${err.response?.data?.detail || err.message}`);
        } finally {
            console.log('Setting pythonRunning to false');
            setPythonRunning(false);
        }
    };

    const handleCleanupPython = async () => {
        if (!pythonSessionId) return;

        try {
            await api.delete(`/python/cleanup/${pythonSessionId}`);
            setPythonSessionId(null);
            setPythonOutput('');
            setShowPythonOutput(false);
        } catch (err) {
            console.error('Failed to cleanup Python environment:', err);
        }
    };

    const isPythonFile = (file) => {
        return file && file.name && file.name.endsWith('.py');
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item
        });
    };

    const isImage = (item) => {
        if (item.is_dir) return false;
        const ext = item.name.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    const getThumbnailUrl = (item) => {
        const path = currentPath ? `${currentPath}/${item.name}` : item.name;
        const token = localStorage.getItem('token');
        return `${api.defaults.baseURL}/files/${path}?token=${token}`;
    };

    const ImageThumbnail = ({ item, size }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoaded, setImageLoaded] = useState(false);

        const sizeClasses = {
            small: 'w-16 h-16',
            medium: 'w-24 h-24',
            large: 'w-40 h-40'
        };
        const sizeClass = sizeClasses[size] || sizeClasses.medium;

        if (imageError) {
            return <ImageIcon className={`${sizeClass.split(' ')[0]} ${sizeClass.split(' ')[1]} text-purple-500`} />;
        }

        return (
            <div className={`${sizeClass} relative rounded-lg overflow-hidden bg-slate-800/50`}>
                {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-purple-500/50 animate-pulse" />
                    </div>
                )}
                <img
                    src={getThumbnailUrl(item)}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
            </div>
        );
    };

    const getIcon = (item, size = 'medium') => {
        const sizeClasses = {
            small: 'w-6 h-6',
            medium: 'w-10 h-10',
            large: 'w-16 h-16'
        };
        const sizeClass = sizeClasses[size] || sizeClasses.medium;

        if (item.is_dir) return <Folder className={`${sizeClass} text-yellow-500`} />;
        const ext = item.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon className={`${sizeClass} text-purple-500`} />;
        if (['mp4', 'webm', 'mov'].includes(ext)) return <Video className={`${sizeClass} text-red-500`} />;
        if (['mp3', 'wav'].includes(ext)) return <Music className={`${sizeClass} text-green-500`} />;
        return <FileText className={`${sizeClass} text-blue-500`} />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleViewTypeChange = (type) => {
        setViewType(type);
        localStorage.setItem('viewType', type);
    };

    const handleViewSizeChange = (size) => {
        setViewSize(size);
        localStorage.setItem('viewSize', size);
    };

    const getFileType = (item) => {
        if (item.is_dir) return 'File folder';
        const ext = item.name.split('.').pop().toLowerCase();
        const types = {
            'jpg': 'JPG Image',
            'jpeg': 'JPEG Image',
            'png': 'PNG Image',
            'gif': 'GIF Image',
            'webp': 'WebP Image',
            'mp4': 'MP4 Video',
            'webm': 'WebM Video',
            'mov': 'MOV Video',
            'mp3': 'MP3 Audio',
            'wav': 'WAV Audio',
            'pdf': 'PDF Document',
            'txt': 'Text Document',
            'md': 'Markdown Document',
            'doc': 'Word Document',
            'docx': 'Word Document',
            'xls': 'Excel Spreadsheet',
            'xlsx': 'Excel Spreadsheet',
            'zip': 'ZIP Archive',
            'rar': 'RAR Archive',
            '7z': '7Z Archive'
        };
        return types[ext] || `${ext.toUpperCase()} File`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        } else if (diffDays === 1) {
            return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) + ' ' +
                date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
    };

    const handleSortChange = (newSortBy) => {
        if (sortBy === newSortBy) {
            // Toggle order if clicking the same sort option
            const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            setSortOrder(newOrder);
            localStorage.setItem('sortOrder', newOrder);
        } else {
            // Set new sort option with ascending order
            setSortBy(newSortBy);
            setSortOrder('asc');
            localStorage.setItem('sortBy', newSortBy);
            localStorage.setItem('sortOrder', 'asc');
        }
    };

    const sortItems = (itemsToSort) => {
        const sorted = [...itemsToSort].sort((a, b) => {
            // Always keep folders first
            if (a.is_dir && !b.is_dir) return -1;
            if (!a.is_dir && b.is_dir) return 1;

            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                    break;
                case 'size':
                    if (a.is_dir && b.is_dir) {
                        comparison = a.name.localeCompare(b.name);
                    } else {
                        comparison = (a.size || 0) - (b.size || 0);
                    }
                    break;
                case 'date':
                    comparison = (a.modified || 0) - (b.modified || 0);
                    break;
                case 'type':
                    const getExt = (name) => name.split('.').pop().toLowerCase();
                    const extA = a.is_dir ? 'folder' : getExt(a.name);
                    const extB = b.is_dir ? 'folder' : getExt(b.name);
                    comparison = extA.localeCompare(extB);
                    if (comparison === 0) {
                        comparison = a.name.localeCompare(b.name);
                    }
                    break;
                default:
                    comparison = a.name.localeCompare(b.name);
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return sorted;
    };

    const sortedItems = sortItems(items);

    const breadcrumbs = currentPath.split('/').filter(Boolean);

    return (
        <div className="min-h-screen pb-20 md:pb-10 bg-slate-950">
            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowNewFolderModal(false)}>
                    <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FolderPlus className="w-6 h-6 text-blue-500" />
                            Create New Folder
                        </h3>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                            className="input-field mb-4"
                            placeholder="Folder name"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={handleCreateFolder} className="btn-primary flex-1 py-3">
                                Create
                            </button>
                            <button onClick={() => setShowNewFolderModal(false)} className="btn-secondary flex-1 py-3">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowShareModal(null)}>
                    <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Share2 className="w-6 h-6 text-purple-500" />
                            Share "{showShareModal.name}"
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">Share with user</label>
                                <input
                                    type="text"
                                    value={shareUsername}
                                    onChange={(e) => setShareUsername(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter username"
                                    list="users-list"
                                />
                                <datalist id="users-list">
                                    {users.filter(u => u.username !== user?.username).map(u => (
                                        <option key={u.id} value={u.username} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">Permission</label>
                                <select
                                    value={sharePermission}
                                    onChange={(e) => setSharePermission(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="read">Read Only</option>
                                    <option value="write">Read & Write</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleShare} className="btn-primary flex-1 py-3">
                                Share
                            </button>
                            <button onClick={() => setShowShareModal(null)} className="btn-secondary flex-1 py-3">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => !user?.require_password_change && setShowPasswordModal(false)}>
                    <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Key className="w-6 h-6 text-yellow-500" />
                            Change Password
                        </h3>
                        {user?.require_password_change && (
                            <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                <p className="text-sm text-orange-300 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    You are required to change your password before continuing.
                                </p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleChangePassword} className="btn-primary flex-1 py-3">
                                Change Password
                            </button>
                            {!user?.require_password_change && (
                                <button onClick={() => setShowPasswordModal(false)} className="btn-secondary flex-1 py-3">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* File Editor Modal */}
            {showEditor && editorFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 md:p-4">
                    <div className="bg-slate-900 rounded-xl w-full h-full md:h-[90vh] max-w-6xl flex flex-col shadow-2xl border border-white/10">
                        {/* Editor Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800">
                            <div className="flex items-center gap-3">
                                <Edit className="w-5 h-5 text-blue-500" />
                                <div>
                                    <h3 className="text-lg font-medium text-white">{editorFile.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-slate-400">{getFileLanguage(editorFile.name)}</p>
                                        {activeUsers.length > 0 && (
                                            <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20">
                                                <Users className="w-3 h-3 text-green-400" />
                                                <span className="text-xs text-green-400">
                                                    {activeUsers.length} active: {activeUsers.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isPythonFile(editorFile) && (
                                    <button
                                        onClick={handleRunPython}
                                        disabled={pythonRunning}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Play className="w-4 h-4" />
                                        {pythonRunning ? 'Running...' : 'Run'}
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveFile}
                                    disabled={editorSaving}
                                    className="btn-primary flex items-center gap-2 px-4 py-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {editorSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEditor(false);
                                        setEditorContent('');
                                        setEditorFile(null);
                                    }}
                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {/* Editor Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className={`flex-1 overflow-hidden ${showPythonOutput ? 'h-2/3' : 'h-full'}`}>
                                <CodeEditor
                                    value={editorContent}
                                    onChange={(e) => {
                                        const newContent = e.target.value;
                                        setEditorContent(newContent);
                                        if (socket && socket.readyState === WebSocket.OPEN) {
                                            socket.send(JSON.stringify({
                                                type: 'text_change',
                                                content: newContent
                                            }));
                                        }
                                    }}
                                    language={getFileLanguage(editorFile?.name || '')}
                                    readOnly={false}
                                />
                            </div>

                            {/* Terminal Output */}
                            {showPythonOutput && (
                                <div className="h-1/3 bg-black border-t border-white/10 flex flex-col transition-all duration-300">
                                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Terminal className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-300">Terminal Output</span>
                                        </div>
                                        <button
                                            onClick={() => setShowPythonOutput(false)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 p-4 overflow-auto font-mono text-sm">
                                        <pre className="text-slate-300 whitespace-pre-wrap">{pythonOutput}</pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Editor Footer */}
                        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-slate-800 text-xs text-slate-400">
                            <div>Lines: {editorContent.split('\n').length} | Characters: {editorContent.length}</div>
                            <div>Press Ctrl+S to save</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu - Mobile Friendly (Bottom Sheet style on mobile?) */}
            {
                contextMenu && (
                    <>
                        {/* Backdrop for mobile to close context menu */}
                        <div className="fixed inset-0 z-[89] md:hidden" onClick={() => setContextMenu(null)} />
                        <div
                            className="fixed md:absolute z-[90] bg-slate-800 border border-white/10 rounded-t-xl md:rounded-lg shadow-2xl py-2 min-w-[200px] bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto md:w-auto"
                            style={window.innerWidth >= 768 ? { left: contextMenu.x, top: contextMenu.y } : {}}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="md:hidden w-12 h-1 bg-slate-600 rounded-full mx-auto mb-4 mt-2" />
                            <div className="px-4 pb-2 md:hidden border-b border-white/5 mb-2">
                                <p className="font-medium text-white truncate">{contextMenu.item.name}</p>
                            </div>

                            {!contextMenu.item.is_dir && (
                                <>
                                    {isEditable(contextMenu.item) && (
                                        <button
                                            onClick={() => {
                                                handleEditFile(contextMenu.item);
                                                setContextMenu(null);
                                            }}
                                            className="w-full px-4 py-3 md:py-2 text-left hover:bg-white/10 flex items-center gap-3 text-slate-200 transition-colors active:bg-white/20"
                                        >
                                            <Edit className="w-5 h-5 md:w-4 md:h-4" />
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            handleDownload(contextMenu.item.name);
                                            setContextMenu(null);
                                        }}
                                        className="w-full px-4 py-3 md:py-2 text-left hover:bg-white/10 flex items-center gap-3 text-slate-200 transition-colors active:bg-white/20"
                                    >
                                        <Download className="w-5 h-5 md:w-4 md:h-4" />
                                        Download
                                    </button>
                                </>
                            )}
                            {user?.user_level !== 'read-only' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowShareModal(contextMenu.item);
                                            setContextMenu(null);
                                        }}
                                        className="w-full px-4 py-3 md:py-2 text-left hover:bg-white/10 flex items-center gap-3 text-slate-200 transition-colors active:bg-white/20"
                                    >
                                        <Share2 className="w-5 h-5 md:w-4 md:h-4" />
                                        Share {contextMenu.item.is_dir ? 'Folder' : 'File'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDelete(contextMenu.item.name);
                                            setContextMenu(null);
                                        }}
                                        className="w-full px-4 py-3 md:py-2 text-left hover:bg-red-500/20 flex items-center gap-3 text-red-400 transition-colors active:bg-red-500/30"
                                    >
                                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )
            }

            {/* Header */}
            <header className="glass sticky top-0 z-50 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-4 overflow-hidden">
                        <Link to="/" className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent shrink-0">
                            FileServer
                        </Link>
                        <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
                        <nav className="flex items-center space-x-1 md:space-x-2 text-sm text-slate-400 overflow-x-auto no-scrollbar mask-linear-fade">
                            <Link to="/" className="hover:text-white transition-colors shrink-0"><Home className="w-4 h-4" /></Link>
                            {breadcrumbs.map((crumb, i) => (
                                <React.Fragment key={i}>
                                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                                    <Link
                                        to={`/${breadcrumbs.slice(0, i + 1).join('/')}`}
                                        className="hover:text-white transition-colors whitespace-nowrap"
                                    >
                                        {decodeURIComponent(crumb)}
                                    </Link>
                                </React.Fragment>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
                        {/* Navigation Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNavMenu(!showNavMenu)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-blue-400"
                                title="Navigation"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            {showNavMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNavMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-lg shadow-2xl z-50 py-2">
                                        <button
                                            onClick={() => {
                                                setViewMode('home');
                                                setShowNavMenu(false);
                                                navigate('/');
                                            }}
                                            className={`w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors ${viewMode === 'home' ? 'text-blue-400 bg-white/5' : 'text-slate-200'}`}
                                        >
                                            <Home className="w-4 h-4" />
                                            Home
                                        </button>

                                        <button
                                            onClick={() => {
                                                setViewMode('shared');
                                                setShowNavMenu(false);
                                                navigate('/');
                                            }}
                                            className={`w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors ${viewMode === 'shared' ? 'text-purple-400 bg-white/5' : 'text-slate-200'}`}
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Shared with Me
                                        </button>

                                        {user?.is_admin && users.length > 0 && (
                                            <>
                                                <div className="h-px bg-white/10 my-2" />
                                                <div className="px-4 py-1 text-xs text-slate-500 uppercase">User Folders</div>
                                                {users.filter(u => u.username !== user.username).map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => {
                                                            setViewMode(`user:${u.username}`);
                                                            setShowNavMenu(false);
                                                            navigate(u.root_path || '/');
                                                        }}
                                                        className={`w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors ${viewMode === `user:${u.username}` ? 'text-green-400 bg-white/5' : 'text-slate-200'}`}
                                                    >
                                                        <Users className="w-4 h-4" />
                                                        {u.username}
                                                        <span className="text-xs text-slate-500 ml-auto">{u.root_path || '/'}</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setShowAccountSettings(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Account Settings"
                        >
                            <User className="w-5 h-5" />
                        </button>
                        {user?.is_admin && (
                            <Link to="/admin" className="btn-secondary flex items-center space-x-2 !px-3">
                                <Settings className="w-4 h-4" />
                                <span className="hidden md:inline">Admin</span>
                            </Link>
                        )}
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                navigate('/login');
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full mx-auto px-4 py-6 md:py-8">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white truncate">
                        {breadcrumbs.length > 0 ? decodeURIComponent(breadcrumbs[breadcrumbs.length - 1]) : 'Home'}
                    </h2>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={fetchItems}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 shrink-0"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        {/* View Type Toggle */}
                        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 shrink-0">
                            <button
                                onClick={() => handleViewTypeChange('grid')}
                                className={`p-1.5 rounded transition-colors ${viewType === 'grid' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleViewTypeChange('list')}
                                className={`p-1.5 rounded transition-colors ${viewType === 'list' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {/* View Size Selector */}
                        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 shrink-0">
                            <button
                                onClick={() => handleViewSizeChange('small')}
                                className={`px-2 py-1.5 rounded text-xs transition-colors ${viewSize === 'small' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Small"
                            >
                                S
                            </button>
                            <button
                                onClick={() => handleViewSizeChange('medium')}
                                className={`px-2 py-1.5 rounded text-xs transition-colors ${viewSize === 'medium' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Medium"
                            >
                                M
                            </button>
                            <button
                                onClick={() => handleViewSizeChange('large')}
                                className={`px-2 py-1.5 rounded text-xs transition-colors ${viewSize === 'large' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Large"
                            >
                                L
                            </button>
                        </div>

                        {/* Sort Options */}
                        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 shrink-0">
                            <button
                                onClick={() => handleSortChange('name')}
                                className={`px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-1 ${sortBy === 'name' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Sort by Name"
                            >
                                Name
                                {sortBy === 'name' && (
                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                )}
                            </button>
                            <button
                                onClick={() => handleSortChange('size')}
                                className={`px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-1 ${sortBy === 'size' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Sort by Size"
                            >
                                Size
                                {sortBy === 'size' && (
                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                )}
                            </button>
                            <button
                                onClick={() => handleSortChange('date')}
                                className={`px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-1 ${sortBy === 'date' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Sort by Date"
                            >
                                Date
                                {sortBy === 'date' && (
                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                )}
                            </button>
                            <button
                                onClick={() => handleSortChange('type')}
                                className={`px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-1 ${sortBy === 'type' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title="Sort by Type"
                            >
                                Type
                                {sortBy === 'type' && (
                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                )}
                            </button>
                        </div>

                        {user?.user_level !== 'read-only' && (
                            <>
                                <button
                                    onClick={() => setShowNewFolderModal(true)}
                                    className="btn-secondary flex items-center space-x-2 whitespace-nowrap"
                                >
                                    <FolderPlus className="w-4 h-4" />
                                    <span>New Folder</span>
                                </button>

                                {/* File Upload */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="btn-primary flex items-center space-x-2 whitespace-nowrap disabled:opacity-50"
                                    title="Upload files"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span className="hidden md:inline">{uploading ? 'Uploading...' : 'Upload Files'}</span>
                                    <span className="md:hidden">Files</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    multiple
                                    className="hidden"
                                />

                                {/* Folder Upload */}
                                <button
                                    onClick={() => folderInputRef.current?.click()}
                                    disabled={uploading}
                                    className="btn-secondary flex items-center space-x-2 whitespace-nowrap disabled:opacity-50"
                                    title="Upload folder with structure"
                                >
                                    <FolderUp className="w-4 h-4" />
                                    <span className="hidden md:inline">{uploading ? 'Uploading...' : 'Upload Folder'}</span>
                                    <span className="md:hidden">Folder</span>
                                </button>
                                <input
                                    type="file"
                                    ref={folderInputRef}
                                    onChange={handleFolderUpload}
                                    webkitdirectory=""
                                    directory=""
                                    multiple
                                    className="hidden"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Grid/List View */}
                {
                    viewType === 'grid' ? (
                        <div className={`grid gap-3 md:gap-4 ${viewSize === 'small' ? 'grid-cols-3 md:grid-cols-6 lg:grid-cols-8' :
                            viewSize === 'medium' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' :
                                'grid-cols-1 md:grid-cols-3 lg:grid-cols-4'
                            }`}>
                            {sortedItems.map((item) => (
                                <div
                                    key={item.name}
                                    className="glass-card p-3 md:p-4 group relative flex flex-col items-center text-center cursor-pointer active:scale-95 transition-transform"
                                    onClick={() => {
                                        if (item.is_dir) {
                                            navigate(item.path);
                                        } else {
                                            handlePreview(item);
                                        }
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                >
                                    <div className="mb-2 md:mb-3 transition-transform group-hover:scale-110 duration-300">
                                        {isImage(item) ? (
                                            <ImageThumbnail item={item} size={viewSize} />
                                        ) : (
                                            getIcon(item, viewSize)
                                        )}
                                    </div>
                                    <p className={`font-medium text-slate-200 truncate w-full mb-1 ${viewSize === 'small' ? 'text-[10px]' :
                                        viewSize === 'medium' ? 'text-xs md:text-sm' :
                                            'text-sm md:text-base'
                                        }`}>
                                        {item.name}
                                    </p>
                                    <p className={`text-slate-500 ${viewSize === 'small' ? 'text-[9px]' :
                                        viewSize === 'medium' ? 'text-[10px] md:text-xs' :
                                            'text-xs md:text-sm'
                                        }`}>
                                        {item.is_dir ? 'Folder' : formatSize(item.size)}
                                    </p>

                                    {/* Actions Overlay - Desktop Hover */}
                                    <div className="hidden md:flex absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                        {!item.is_dir && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(item.name);
                                                }}
                                                className="p-1.5 bg-slate-800 hover:bg-blue-600 rounded-lg text-slate-300 hover:text-white transition-colors"
                                            >
                                                <Download className="w-3 h-3" />
                                            </button>
                                        )}
                                        {user?.user_level !== 'read-only' && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowShareModal(item);
                                                    }}
                                                    className="p-1.5 bg-slate-800 hover:bg-purple-600 rounded-lg text-slate-300 hover:text-white transition-colors"
                                                >
                                                    <Share2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(item.name);
                                                    }}
                                                    className="p-1.5 bg-slate-800 hover:bg-red-500 rounded-lg text-slate-300 hover:text-white transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Mobile Context Menu Trigger */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu({ clientX: 0, clientY: 0 }, item);
                                        }}
                                        className="md:hidden absolute top-2 right-2 p-1 text-slate-400"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                    </button>
                                </div>
                            ))}

                            {items.length === 0 && !loading && (
                                <div className="col-span-full text-center py-10 md:py-20 text-slate-500">
                                    <Folder className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-20" />
                                    <p>This folder is empty</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* List View - Windows Explorer Style */
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b border-white/10 ${viewSize === 'small' ? 'text-xs' :
                                            viewSize === 'medium' ? 'text-sm' :
                                                'text-base'
                                            }`}>
                                            <th
                                                className="text-left font-medium text-slate-400 px-4 md:px-6 py-3 md:py-4 cursor-pointer hover:text-white transition-colors group"
                                                onClick={() => handleSortChange('name')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Name
                                                    {sortBy === 'name' && (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                className="text-left font-medium text-slate-400 px-4 md:px-6 py-3 md:py-4 hidden md:table-cell cursor-pointer hover:text-white transition-colors group"
                                                onClick={() => handleSortChange('date')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Date modified
                                                    {sortBy === 'date' && (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                className="text-left font-medium text-slate-400 px-4 md:px-6 py-3 md:py-4 hidden lg:table-cell cursor-pointer hover:text-white transition-colors group"
                                                onClick={() => handleSortChange('type')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Type
                                                    {sortBy === 'type' && (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                className="text-right font-medium text-slate-400 px-4 md:px-6 py-3 md:py-4 cursor-pointer hover:text-white transition-colors group"
                                                onClick={() => handleSortChange('size')}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    Size
                                                    {sortBy === 'size' && (
                                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="w-8 md:w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedItems.map((item) => (
                                            <tr
                                                key={item.name}
                                                className={`group border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${viewSize === 'small' ? 'text-xs' :
                                                    viewSize === 'medium' ? 'text-sm' :
                                                        'text-base'
                                                    }`}
                                                onClick={() => {
                                                    if (item.is_dir) {
                                                        navigate(item.path);
                                                    } else {
                                                        handlePreview(item);
                                                    }
                                                }}
                                                onContextMenu={(e) => handleContextMenu(e, item)}
                                            >
                                                {/* Name Column */}
                                                <td className={`px-4 md:px-6 ${viewSize === 'small' ? 'py-2 md:py-2' :
                                                    viewSize === 'medium' ? 'py-3 md:py-3' :
                                                        'py-4 md:py-4'
                                                    }`}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="shrink-0">
                                                            {isImage(item) && viewSize !== 'small' ? (
                                                                <div className="w-5 h-5 rounded overflow-hidden bg-slate-800/50">
                                                                    <img
                                                                        src={getThumbnailUrl(item)}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        loading="lazy"
                                                                        onError={(e) => e.target.style.display = 'none'}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                getIcon(item, 'small')
                                                            )}
                                                        </div>
                                                        <span className="text-slate-200 truncate">{item.name}</span>
                                                    </div>
                                                </td>

                                                {/* Date Modified Column */}
                                                <td className="px-3 md:px-4 text-slate-400 hidden md:table-cell">
                                                    {formatDate(item.modified)}
                                                </td>

                                                {/* Type Column */}
                                                <td className="px-3 md:px-4 text-slate-400 hidden lg:table-cell">
                                                    {getFileType(item)}
                                                </td>

                                                {/* Size Column */}
                                                <td className="px-3 md:px-4 text-slate-400 text-right">
                                                    {item.is_dir ? '-' : formatSize(item.size)}
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-2">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        {!item.is_dir && isEditable(item) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditFile(item);
                                                                }}
                                                                className="p-1.5 hover:bg-blue-600 rounded text-slate-400 hover:text-white transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {!item.is_dir && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(item.name);
                                                                }}
                                                                className="p-1.5 hover:bg-blue-600 rounded text-slate-400 hover:text-white transition-colors"
                                                                title="Download"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {user?.user_level !== 'read-only' && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShowShareModal(item);
                                                                    }}
                                                                    className="p-1.5 hover:bg-purple-600 rounded text-slate-400 hover:text-white transition-colors"
                                                                    title="Share"
                                                                >
                                                                    <Share2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(item.name);
                                                                    }}
                                                                    className="p-1.5 hover:bg-red-500 rounded text-slate-400 hover:text-white transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleContextMenu({ clientX: 0, clientY: 0 }, item);
                                                            }}
                                                            className="md:hidden p-1.5 text-slate-400"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {items.length === 0 && !loading && (
                                <div className="text-center py-10 md:py-20 text-slate-500">
                                    <Folder className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-20" />
                                    <p>This folder is empty</p>
                                </div>
                            )}
                        </div>
                    )
                }
            </main >

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={closePreview}>
                    <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={closePreview}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {previewItem.type === 'image' ? (
                            <img
                                src={previewItem.blobUrl}
                                alt={previewItem.name}
                                className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg"
                            />
                        ) : (
                            <div className="bg-slate-900 rounded-lg overflow-hidden h-[85vh] flex flex-col">
                                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
                                    <h3 className="text-lg font-semibold text-white">{previewItem.name}</h3>
                                    <div className="flex gap-2">
                                        {isEditable(previewItem) && (
                                            <button
                                                onClick={() => {
                                                    closePreview();
                                                    handleEditFile(previewItem);
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownload(previewItem.name)}
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <CodeEditor
                                        value={previewItem.content}
                                        language={getFileLanguage(previewItem.name)}
                                        readOnly={true}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Code Editor Modal */}
            {showEditor && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-400" />
                                <h3 className="text-lg font-semibold text-white">{editorFile?.name}</h3>
                                {activeUsers.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Users className="w-4 h-4" />
                                        <span>{activeUsers.length} active</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {isPythonFile(editorFile) && (
                                    <button
                                        onClick={handleRunPython}
                                        disabled={pythonRunning}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded flex items-center gap-2"
                                    >
                                        <Play className="w-4 h-4" />
                                        {pythonRunning ? 'Running...' : 'Run'}
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveFile}
                                    disabled={editorSaving}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {editorSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEditor(false);
                                        setEditorContent('');
                                        setEditorFile(null);
                                        if (socketRef.current) {
                                            socketRef.current.close();
                                            socketRef.current = null;
                                        }
                                    }}
                                    className="p-2 hover:bg-slate-800 rounded text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 overflow-hidden relative">
                            <CodeEditor
                                value={editorContent}
                                onChange={(e) => {
                                    const newContent = e.target.value;
                                    setEditorContent(newContent);
                                    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                                        socketRef.current.send(JSON.stringify({
                                            type: 'content_update',
                                            content: newContent
                                        }));
                                    }
                                }}
                                language={getFileLanguage(editorFile?.name || '')}
                                cursors={cursors}
                                onCursorChange={handleCursorChange}
                            />
                        </div>

                        {/* Python Output */}
                        {showPythonOutput && (
                            <div className="border-t border-slate-700 p-4 max-h-64 overflow-auto bg-slate-950">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Terminal className="w-4 h-4" />
                                        <span>Output</span>
                                    </div>
                                    <button
                                        onClick={() => setShowPythonOutput(false)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{pythonOutput}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Account Settings Modal */}
            {showAccountSettings && (
                <AccountSettings onClose={() => setShowAccountSettings(false)} />
            )}

            {/* Recovery Email Setup Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Setup Recovery Email</h3>
                                <p className="text-sm text-slate-400">Required for account security</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Recovery Email</label>
                                <input
                                    type="email"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter your email address"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Current Password</label>
                                <input
                                    type="password"
                                    value={recoveryPassword}
                                    onChange={(e) => setRecoveryPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Confirm password to save"
                                />
                            </div>

                            <button
                                onClick={async () => {
                                    if (!recoveryEmail || !recoveryPassword) {
                                        alert('Please fill in all fields');
                                        return;
                                    }
                                    try {
                                        const formData = new FormData();
                                        formData.append('new_email', recoveryEmail);
                                        formData.append('current_password', recoveryPassword);

                                        await api.put('/account/settings', formData);
                                        setShowEmailModal(false);
                                        alert('Recovery email saved successfully');
                                        fetchUser(); // Refresh user to clear check
                                    } catch (err) {
                                        alert(err.response?.data?.detail || 'Failed to save email');
                                    }
                                }}
                                className="w-full btn-primary py-3 mt-2"
                            >
                                Save Recovery Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
