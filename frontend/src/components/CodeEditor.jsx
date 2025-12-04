import React, { useRef, useEffect } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'; // html/xml
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';

// Register languages
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', javascript);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('xml', markup);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('c', c);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('cs', csharp);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('tsx', typescript);

const CodeEditor = ({ value, onChange, language = 'javascript', readOnly = false, cursors = [], onCursorChange }) => {
    const textareaRef = useRef(null);
    const highlightRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const cursorLayerRef = useRef(null);
    const [charWidth, setCharWidth] = React.useState(0);

    // Calculate line numbers
    const lineCount = (value || '').split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    // Measure character width
    useEffect(() => {
        const span = document.createElement('span');
        span.style.fontFamily = 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace';
        span.style.fontSize = '14px';
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.textContent = 'M';
        document.body.appendChild(span);
        const width = span.getBoundingClientRect().width;
        setCharWidth(width);
        document.body.removeChild(span);
    }, []);

    // Sync scroll
    useEffect(() => {
        const textarea = textareaRef.current;
        const highlight = highlightRef.current;
        const lineNumbersEl = lineNumbersRef.current;
        const cursorLayer = cursorLayerRef.current;

        if (textarea && highlight && lineNumbersEl) {
            const handleScroll = () => {
                // Sync vertical scroll to line numbers
                lineNumbersEl.scrollTop = textarea.scrollTop;

                // Sync all scroll to highlighter
                highlight.scrollTop = textarea.scrollTop;
                highlight.scrollLeft = textarea.scrollLeft;

                // Sync cursor layer
                if (cursorLayer) {
                    cursorLayer.scrollTop = textarea.scrollTop;
                    cursorLayer.scrollLeft = textarea.scrollLeft;
                }
            };

            textarea.addEventListener('scroll', handleScroll);
            return () => textarea.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const handleSelect = (e) => {
        if (onCursorChange) {
            onCursorChange(e.target.selectionStart);
        }
    };

    const getCursorCoordinates = (position) => {
        if (!value) return { top: 0, left: 0 };
        const textBefore = value.substring(0, position);
        const lines = textBefore.split('\n');
        const row = lines.length - 1;
        const col = lines[lines.length - 1].length;
        return {
            top: row * 21, // lineHeight
            left: col * charWidth
        };
    };

    const commonStyles = {
        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        fontSize: '14px',
        lineHeight: '21px',
    };

    return (
        <div className="flex w-full h-full bg-[#1e1e1e] overflow-hidden">
            {/* Line Numbers Sidebar */}
            <div
                ref={lineNumbersRef}
                className="flex-shrink-0 w-[3.5rem] bg-[#1e1e1e] text-[#6e7681] text-right select-none overflow-hidden border-r border-white/10"
                style={{
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    paddingRight: '1rem',
                    ...commonStyles
                }}
            >
                {lineNumbers.map(num => (
                    <div key={num}>{num}</div>
                ))}
            </div>

            {/* Editor Area */}
            <div className="relative flex-1 h-full overflow-hidden">
                {readOnly ? (
                    <div className="w-full h-full overflow-auto p-4">
                        <SyntaxHighlighter
                            language={language}
                            style={vscDarkPlus}
                            customStyle={{
                                margin: 0,
                                padding: 0,
                                background: 'transparent',
                                ...commonStyles
                            }}
                            showLineNumbers={false}
                        >
                            {value}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <>
                        {/* Layer 1: Syntax highlighted background */}
                        <div
                            ref={highlightRef}
                            className="absolute inset-0 pointer-events-none overflow-hidden"
                        >
                            <div style={{ padding: '1rem', minHeight: '100%', position: 'relative' }}>
                                <SyntaxHighlighter
                                    language={language}
                                    style={vscDarkPlus}
                                    customStyle={{
                                        margin: 0,
                                        padding: 0,
                                        background: 'transparent',
                                        ...commonStyles
                                    }}
                                    codeTagProps={{ style: commonStyles }}
                                    showLineNumbers={false}
                                    wrapLines={false}
                                >
                                    {value || ' '}
                                </SyntaxHighlighter>
                            </div>
                        </div>

                        {/* Layer 2: Editable textarea overlay */}
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={onChange}
                            onSelect={handleSelect}
                            onClick={handleSelect}
                            onKeyUp={handleSelect}
                            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white resize-none outline-none overflow-auto"
                            style={{
                                caretColor: 'white',
                                colorScheme: 'dark',
                                padding: '1rem',
                                whiteSpace: 'pre',
                                overflowWrap: 'normal',
                                ...commonStyles
                            }}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                        />

                        {/* Layer 3: Remote Cursors (Top Layer) */}
                        <div
                            ref={cursorLayerRef}
                            className="absolute inset-0 pointer-events-none overflow-hidden z-10"
                        >
                            <div style={{ padding: '1rem', minHeight: '100%', position: 'relative' }}>
                                {cursors.map((cursor, index) => {
                                    const coords = getCursorCoordinates(cursor.position);
                                    return (
                                        <div
                                            key={cursor.username}
                                            className="absolute transition-all duration-100 group pointer-events-auto"
                                            style={{
                                                top: `${coords.top}px`,
                                                left: `${coords.left}px`,
                                                height: '21px',
                                                zIndex: 20
                                            }}
                                        >
                                            {/* Cursor Bar */}
                                            <div
                                                className="w-[2px] h-full"
                                                style={{ backgroundColor: cursor.color }}
                                            />

                                            {/* Name Tag */}
                                            <div
                                                className="absolute top-0 left-0 -mt-6 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                style={{ backgroundColor: cursor.color }}
                                            >
                                                {cursor.username}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CodeEditor;
