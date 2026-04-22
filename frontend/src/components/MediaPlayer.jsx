import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward, Clock, Gauge, Subtitles, Check, RotateCcw } from 'lucide-react';

const QUALITY_OPTIONS = [
    { label: 'Source', height: 0 },
    { label: 'Auto', height: 0 },
    { label: '4K', height: 2160 },
    { label: '1440p', height: 1440 },
    { label: '1080p', height: 1080 },
    { label: '720p', height: 720 },
    { label: '480p', height: 480 },
    { label: '360p', height: 360 }
];

const MediaPlayer = ({ src, type, title, onClose, autoPlay = false, tracks = [], fileId }) => {
    const mediaRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [isHoveringSeek, setIsHoveringSeek] = useState(false);

    // Feature States
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [sleepTimer, setSleepTimer] = useState(null);
    const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
    const [quality, setQuality] = useState('Auto');
    const [videoSrc, setVideoSrc] = useState(src);
    const [maxResolution, setMaxResolution] = useState(0);

    const controlsTimeoutRef = useRef(null);
    const sleepTimerRef = useRef(null);

    const isVideo = type === 'video';

    useEffect(() => {
        setVideoSrc(src);
    }, [src]);

    const handleQualityChange = (newQuality) => {
        setQuality(newQuality);
        if (!isVideo) return;

        // Save current position
        if (mediaRef.current) {
            localStorage.setItem(`media-progress-${fileId}`, mediaRef.current.currentTime);
        }

        // Construct new URL
        const urlObj = new URL(src, window.location.origin);
        if (newQuality !== 'Auto') {
            urlObj.searchParams.set('quality', newQuality);
        } else {
            urlObj.searchParams.delete('quality');
        }
        setVideoSrc(urlObj.toString());
    };

    // Resume Playback
    useEffect(() => {
        if (!fileId) return;
        const savedTime = localStorage.getItem(`media-progress-${fileId}`);
        if (savedTime && mediaRef.current) {
            const time = parseFloat(savedTime);
            if (time < mediaRef.current.duration - 5) {
                mediaRef.current.currentTime = time;
                setCurrentTime(time);
            }
        }
    }, [fileId, videoSrc]);

    // Save Progress
    useEffect(() => {
        if (!fileId || !mediaRef.current) return;
        const saveProgress = () => {
            if (mediaRef.current) localStorage.setItem(`media-progress-${fileId}`, mediaRef.current.currentTime);
        };
        const interval = setInterval(saveProgress, 5000);
        return () => clearInterval(interval);
    }, [fileId]);

    // Media Event Listeners
    useEffect(() => {
        const media = mediaRef.current;
        if (!media) return;

        if (autoPlay) media.play().catch(e => console.log('Autoplay blocked', e));

        const updateTime = () => setCurrentTime(media.currentTime);
        const handleMetadata = () => {
            setDuration(media.duration);
            if (isVideo && media.videoHeight) {
                setMaxResolution(media.videoHeight);
            }
        };
        const updateProgress = () => {
            if (media.buffered.length > 0) {
                setBuffered(media.buffered.end(media.buffered.length - 1));
            }
        };
        const onEnded = () => {
            setIsPlaying(false);
            if (fileId) localStorage.removeItem(`media-progress-${fileId}`);
        };

        media.addEventListener('timeupdate', updateTime);
        media.addEventListener('loadedmetadata', handleMetadata);
        media.addEventListener('progress', updateProgress);
        media.addEventListener('ended', onEnded);

        return () => {
            media.removeEventListener('timeupdate', updateTime);
            media.removeEventListener('loadedmetadata', handleMetadata);
            media.removeEventListener('progress', updateProgress);
            media.removeEventListener('ended', onEnded);
        };
    }, [src, autoPlay, fileId]);

    // Effects for features
    useEffect(() => { if (mediaRef.current) mediaRef.current.playbackRate = playbackRate; }, [playbackRate]);

    useEffect(() => {
        if (sleepTimer) {
            sleepTimerRef.current = setTimeout(() => {
                if (mediaRef.current) {
                    mediaRef.current.pause();
                    setIsPlaying(false);
                    setSleepTimer(null);
                }
            }, sleepTimer * 60 * 1000);
        } else {
            if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
        }
        return () => clearTimeout(sleepTimerRef.current);
    }, [sleepTimer]);

    useEffect(() => {
        if (mediaRef.current) {
            for (let i = 0; i < mediaRef.current.textTracks.length; i++) {
                mediaRef.current.textTracks[i].mode = subtitlesEnabled ? 'showing' : 'hidden';
            }
        }
    }, [subtitlesEnabled, tracks]);


    // Handlers
    const togglePlay = () => {
        if (mediaRef.current.paused) {
            mediaRef.current.play();
            setIsPlaying(true);
        } else {
            mediaRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        mediaRef.current.muted = newMuted;
    };

    const handleVolumeChange = (e) => {
        const sliderValue = parseFloat(e.target.value);
        setVolume(sliderValue);
        // Use cubic curve for logarithmic-like perceptual volume
        // This gives more granular control at lower volumes
        mediaRef.current.volume = Math.pow(sliderValue, 3);
        setIsMuted(sliderValue === 0);
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        mediaRef.current.currentTime = time;
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying && isVideo && !showSettings) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
        }
    };

    const SettingsMenu = () => (
        <div
            className="absolute bottom-16 right-4 w-64 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 p-2 text-sm text-white animate-in fade-in slide-in-from-bottom-5 z-50"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col gap-1">
                {/* Speed */}
                <div className="p-3 hover:bg-white/10 rounded-lg cursor-pointer group relative flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3 text-slate-200">
                        <Gauge className="w-4 h-4" />
                        <span>Playback Speed</span>
                    </div>
                    <span className="text-slate-400 font-medium text-xs bg-white/5 px-2 py-0.5 rounded">{playbackRate}x</span>
                    <div className="hidden group-hover:flex absolute right-full bottom-0 mr-0 bg-slate-900/95 border border-white/10 rounded-lg p-1 flex-col gap-1 w-32 max-h-60 overflow-y-auto overflow-x-hidden shadow-xl backdrop-blur-md">
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
                            <button key={rate} onClick={() => setPlaybackRate(rate)} className={`px-3 py-2 text-left hover:bg-white/10 rounded-md text-xs flex items-center justify-between ${playbackRate === rate ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'}`}>
                                {rate === 1.0 ? 'Normal' : rate + 'x'}
                                {playbackRate === rate && <Check className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subtitles */}
                <div
                    className={`p-3 rounded-lg flex items-center justify-between transition-colors ${tracks.length > 0 ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={() => tracks.length > 0 && setSubtitlesEnabled(!subtitlesEnabled)}
                >
                    <div className="flex items-center gap-3 text-slate-200">
                        <Subtitles className="w-4 h-4" />
                        <span>Subtitles</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${tracks.length === 0 ? 'bg-white/5 text-slate-500' :
                        subtitlesEnabled ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'
                        }`}>
                        {tracks.length === 0 ? 'NONE' : (subtitlesEnabled ? 'ON' : 'OFF')}
                    </span>
                </div>

                {/* Sleep Timer */}
                <div className="p-3 hover:bg-white/10 rounded-lg cursor-pointer group relative flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3 text-slate-200">
                        <Clock className="w-4 h-4" />
                        <span>Sleep Timer</span>
                    </div>
                    <span className="text-slate-400 font-medium text-xs bg-white/5 px-2 py-0.5 rounded">{sleepTimer ? `${sleepTimer}m` : 'Off'}</span>
                    <div className="hidden group-hover:flex absolute right-full bottom-0 mr-0 bg-slate-900/95 border border-white/10 rounded-lg p-1 flex-col gap-1 w-32 max-h-60 overflow-y-auto overflow-x-hidden shadow-xl backdrop-blur-md">
                        {[null, 15, 30, 45, 60].map(time => (
                            <button
                                key={time || 'off'}
                                onClick={() => setSleepTimer(time)}
                                className={`px-3 py-2 text-left hover:bg-white/10 rounded-md text-xs flex items-center justify-between ${sleepTimer === time ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'}`}
                            >
                                {time ? `${time} min` : 'Off'}
                                {sleepTimer === time && <Check className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quality */}
                <div className="p-3 hover:bg-white/10 rounded-lg cursor-pointer group relative flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3 text-slate-200">
                        <Settings className="w-4 h-4" />
                        <span>Quality</span>
                    </div>
                    <span className="text-slate-400 font-medium text-xs bg-white/5 px-2 py-0.5 rounded">{quality}</span>
                    <div className="hidden group-hover:flex absolute right-full bottom-0 mr-0 bg-slate-900/95 border border-white/10 rounded-lg p-1 flex-col gap-1 w-32 max-h-60 overflow-y-auto overflow-x-hidden shadow-xl backdrop-blur-md">
                        {QUALITY_OPTIONS.map(option => {
                            const isEnabled = option.height === 0 || maxResolution === 0 || option.height <= maxResolution;
                            return (
                                <button
                                    key={option.label}
                                    onClick={() => isEnabled && handleQualityChange(option.label)}
                                    disabled={!isEnabled}
                                    className={`px-3 py-2 text-left rounded-md text-xs flex items-center justify-between transition-colors
                                        ${quality === option.label ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'}
                                        ${isEnabled ? 'hover:bg-white/10 cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                                    `}
                                >
                                    {option.label}
                                    {quality === option.label && <Check className="w-3 h-3" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={`relative flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl group/player ${isFullscreen ? 'w-screen h-screen rounded-none' : 'w-full max-h-[85vh]'}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && isVideo && !showSettings && setShowControls(false)}
        >
            {/* Media Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black cursor-pointer" onClick={togglePlay}>
                {isVideo ? (
                    <video
                        ref={mediaRef}
                        src={src}
                        className="w-full h-full object-contain"
                        crossOrigin="anonymous"
                    >
                        {tracks.map((track, i) => (
                            <track key={i} kind={track.kind} label={track.label} srclang={track.srcLang} src={track.src} default={i === 0} />
                        ))}
                    </video>
                ) : (
                    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                        <div className="w-48 h-48 rounded-full bg-white/5 flex items-center justify-center mb-8 animate-pulse-slow">
                            <Play className="w-20 h-20 text-blue-400 fill-current ml-2 opacity-50" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 text-center">{title}</h3>
                        <p className="text-slate-400">Audio Preview</p>
                        <audio ref={mediaRef} src={src} />
                    </div>
                )}

                {/* Center Play Button Animation */}
                {isVideo && !isPlaying && !showSettings && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-all">
                        <div className="w-20 h-20 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all duration-300 group/btn">
                            <Play className="w-8 h-8 text-white fill-current ml-1 group-hover/btn:scale-110 transition-transform" />
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Overlay */}
            <div className={`
                absolute bottom-0 left-0 right-0 z-40
                bg-gradient-to-t from-black/90 via-black/60 to-transparent 
                pt-12 px-3 pb-3 transition-opacity duration-200
                ${showControls || showSettings ? 'opacity-100' : 'opacity-0'}
            `}>
                {/* Progress Bar Container */}
                <div
                    className="group/progress relative h-1.5 hover:h-2.5 w-full bg-white/20 cursor-pointer mb-2 transition-all duration-200 flex items-end"
                    onMouseEnter={() => setIsHoveringSeek(true)}
                    onMouseLeave={() => setIsHoveringSeek(false)}
                >
                    {/* Background */}
                    <div className="absolute inset-0 w-full h-full" />

                    {/* Buffered Bar */}
                    <div
                        className="absolute bottom-0 left-0 h-full bg-white/40 transition-all duration-200"
                        style={{ width: `${(buffered / duration) * 100}%` }}
                    />

                    {/* Played Bar */}
                    <div
                        className="absolute bottom-0 left-0 h-full bg-blue-500 group-hover/progress:bg-blue-400 transition-all duration-75 relative"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                        {/* Scrubber Dot (The "Answer") */}
                        <div className="absolute right-0 bottom-1/2 translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full scale-0 group-hover/progress:scale-100 transition-transform duration-200 shadow-lg border-2 border-white" />
                    </div>

                    {/* Seek Input (Hidden but Functional) */}
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between h-10">
                    <div className="flex items-center gap-1">
                        {/* Play/Pause */}
                        <button onClick={togglePlay} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                        </button>

                        {/* Next (Dummy) */}
                        <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                            <SkipForward className="w-5 h-5 fill-current" />
                        </button>

                        {/* Volume */}
                        <div className="flex items-center gap-0 group/vol relative mx-2">
                            <button onClick={toggleMute} className="p-2 text-white hover:bg-white/10 rounded-full">
                                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 ml-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <div className="text-xs font-medium text-slate-200 ml-2 font-mono">
                            <span>{formatTime(currentTime)}</span>
                            <span className="text-white/40 mx-1">/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 relative">
                        {showSettings && <SettingsMenu />}

                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                            className={`p-2 rounded-full transition-all ${showSettings ? 'bg-white/10 text-white rotate-20' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                        {isVideo && (
                            <button onClick={toggleFullscreen} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaPlayer;
