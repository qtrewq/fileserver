import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Archive, FileText, Image, Code } from 'lucide-react';
import api from '../api';

const FileIcon = ({ name, isDir }) => {
    if (isDir) return <Folder className="w-4 h-4 text-yellow-500" />;

    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image className="w-4 h-4 text-purple-500" />;
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'json'].includes(ext)) return <Code className="w-4 h-4 text-blue-500" />;

    return <FileText className="w-4 h-4 text-slate-400" />;
};

const TreeNode = ({ name, node, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const isDir = node.is_dir;

    const formatSize = (bytes) => {
        if (!bytes && bytes !== 0) return '';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors ${depth > 0 ? 'ml-4' : ''}`}
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                <span className="text-slate-500 w-4 flex justify-center">
                    {hasChildren && (
                        isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                    )}
                </span>

                <FileIcon name={name} isDir={isDir} />

                <span className={`text-sm ${isDir ? 'font-medium text-slate-200' : 'text-slate-400'}`}>
                    {name}
                </span>

                {!isDir && (
                    <span className="ml-auto text-xs text-slate-600 font-mono">
                        {formatSize(node.size)}
                    </span>
                )}
            </div>

            {isExpanded && hasChildren && (
                <div className="border-l border-white/5 ml-3">
                    {Object.entries(node.children).map(([childName, childNode]) => (
                        <TreeNode key={childName} name={childName} node={childNode} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ZipViewer = ({ path }) => {
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchZipContent = async () => {
            try {
                const response = await api.get(`/zip-content/${path}`);
                const fileList = response.data;
                const fileTree = buildFileTree(fileList);
                setTree(fileTree);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.detail || 'Failed to load ZIP content');
            } finally {
                setLoading(false);
            }
        };

        if (path) fetchZipContent();
    }, [path]);

    const buildFileTree = (fileList) => {
        const root = { children: {}, is_dir: true };

        fileList.forEach(file => {
            const parts = file.path.split('/');
            let current = root;

            parts.forEach((part, index) => {
                if (!part) return; // skip empty parts (dividers)

                if (!current.children[part]) {
                    // Initialize node
                    current.children[part] = {
                        children: {},
                        is_dir: index < parts.length - 1 || file.is_dir,
                        size: index === parts.length - 1 ? file.size : 0
                    };
                }
                current = current.children[part];
            });
        });

        return root;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 animate-pulse">
            <Archive className="w-12 h-12 mb-4 opacity-50" />
            <p>Scanning archive contents...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
            <Archive className="w-12 h-12 mb-4 opacity-50" />
            <p>{error}</p>
        </div>
    );

    return (
        <div className="bg-slate-900/50 rounded-lg border border-white/10 p-2 overflow-auto max-h-[60vh]">
            {Object.entries(tree.children).map(([name, node]) => (
                <TreeNode key={name} name={name} node={node} />
            ))}
        </div>
    );
};

export default ZipViewer;
