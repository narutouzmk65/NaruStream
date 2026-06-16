"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw, AlertTriangle, Activity } from 'lucide-react';

interface IPTVPlayerProps {
  url: string;
  title: string;
}

export default function IPTVPlayer({ url, title }: IPTVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hlsInstance, setHlsInstance] = useState<any>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset states when URL changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: any = null;

    // Dynamically import hls.js to make it safe for Next.js SSR
    const initPlayer = async () => {
      try {
        const Hls = (await import('hls.js')).default;

        // Clean up previous instance
        if (hlsInstance) {
          hlsInstance.destroy();
        }

        if (Hls.isSupported()) {
          hls = new Hls({
            maxMaxBufferLength: 10,
            enableWorker: true,
            lowLatencyMode: true,
          });

          hls.loadSource(url);
          hls.attachMedia(video);
          setHlsInstance(hls);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => {
                // Autoplay blocked
                setIsPlaying(false);
              });
          });

          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            console.error('HLS error:', data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn('Network error, trying to recover...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn('Media error, trying to recover...');
                  hls.recoverMediaError();
                  break;
                default:
                  setHasError(true);
                  setIsLoading(false);
                  hls.destroy();
                  break;
              }
            }
          });
        } 
        // Native HLS support (Safari)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
          video.addEventListener('error', () => {
            setHasError(true);
            setIsLoading(false);
          });
        } else {
          // No support
          setHasError(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading HLS library:', err);
        setHasError(true);
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Play failed:", err));
    }
  };

  // Handle Mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const val = parseFloat(e.target.value);
    setVolume(val);
    video.volume = val;
    setIsMuted(val === 0);
    video.muted = val === 0;
  };

  // Handle Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Controls Visibility Timer
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Trigger useEffect re-evaluation
    const tempUrl = url;
    // We force re-attaching
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      className="relative w-full aspect-video rounded-xl bg-black border border-white/5 overflow-hidden group shadow-2xl flex items-center justify-center cursor-pointer"
      onClick={togglePlay}
    >
      {/* Actual HTML5 Video Tag */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        onClick={(e) => e.stopPropagation()} // Let custom play toggle handle it
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0A0F2E]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20 pointer-events-none">
          <Activity size={40} className="text-[var(--color-neon)] animate-pulse" />
          <div className="text-white font-bold font-outfit uppercase tracking-widest text-sm">
            Chargement du flux IPTV...
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-[#0C0F22] flex flex-col items-center justify-center gap-4 z-20 p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <AlertTriangle size={48} className="text-red-500 animate-bounce" />
          <div>
            <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-wide">Flux Temporairement Indisponible</h3>
            <p className="text-gray-400 text-sm max-w-md">
              L'URL IPTV est inaccessible ou le format n'est pas supporté par votre navigateur.
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all duration-300 font-bold text-xs uppercase"
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      )}

      {/* Video Title Header Overlay */}
      {controlsVisible && !hasError && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between pointer-events-none z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-neon)] bg-[var(--color-neon)]/10 px-2 py-0.5 rounded border border-[var(--color-neon)]/20 w-max">
              LIVE TV
            </span>
            <h2 className="text-white font-bold text-sm md:text-base font-outfit truncate drop-shadow-md">
              {title}
            </h2>
          </div>
        </div>
      )}

      {/* Custom Control Bar Overlay */}
      {controlsVisible && !hasError && (
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-3 z-10 transition-opacity duration-300"
          onClick={(e) => e.stopPropagation()} // Stop propagation from triggering togglePlay
        >
          {/* Controls line */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="hover:text-[var(--color-neon)] transition duration-200"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>

              {/* Live Status indicator */}
              <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                <span>DIRECT</span>
              </div>

              {/* Volume controls */}
              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="hover:text-[var(--color-neon)] transition duration-200">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 md:w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[var(--color-neon)]"
                />
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleFullscreen}
                className="hover:text-[var(--color-neon)] transition duration-200"
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
