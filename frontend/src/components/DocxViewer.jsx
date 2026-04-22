import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Loader2, AlertCircle } from 'lucide-react';

const DocxViewer = ({ blob }) => {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const renderDoc = async () => {
            if (!blob || !containerRef.current) return;

            setLoading(true);
            setError(null);

            try {
                await renderAsync(blob, containerRef.current, containerRef.current, {
                    className: 'docx-viewer',
                    inWrapper: false,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    breakPages: true,
                    useBase64URL: true,
                    experimental: true
                });
            } catch (err) {
                console.error(err);
                setError('Failed to render document. It might be corrupted or incompatible.');
            } finally {
                setLoading(false);
            }
        };

        renderDoc();
    }, [blob]);

    return (
        <div className="bg-white rounded-lg w-full h-full overflow-auto p-4 md:p-8 min-h-[500px] flex flex-col">
            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-2" />
                    <p>Rendering document...</p>
                </div>
            )}

            {error && (
                <div className="flex-1 flex flex-col items-center justify-center text-red-500">
                    <AlertCircle className="w-10 h-10 mb-2" />
                    <p>{error}</p>
                </div>
            )}

            {/* Container for docx-preview */}
            <div ref={containerRef} className={`docx-content ${loading || error ? 'hidden' : 'block'}`} />
        </div>
    );
};

export default DocxViewer;
