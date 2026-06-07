"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import styles from "./NarutostreamPlayer.module.css";

export default function NarutostreamPlayer({ src, poster, title, episode, initialTime = 0, onProgress }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);

  const controlsTimeoutRef = useRef(null);
  const hasSeekedRef = useRef(false);
  const lastSavedTimeRef = useRef(0);

  // Reset references when source changes
  useEffect(() => {
    hasSeekedRef.current = false;
    lastSavedTimeRef.current = 0;
  }, [src]);

  // Handle initialTime seek if it loads asynchronously
  useEffect(() => {
    const video = videoRef.current;
    if (video && initialTime && initialTime > 0 && !hasSeekedRef.current) {
      if (video.readyState >= 1) {
        video.currentTime = initialTime;
        hasSeekedRef.current = true;
      }
    }
  }, [initialTime]);

  // ---- HLS setup ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startLevel: -1,        // auto quality
        capLevelToPlayerSize: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    const onTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }

      // Save progress every 10 seconds of playback
      if (onProgress && Math.abs(time - lastSavedTimeRef.current) >= 10) {
        lastSavedTimeRef.current = time;
        onProgress(time);
      }
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      if (initialTime && initialTime > 0 && !hasSeekedRef.current) {
        video.currentTime = initialTime;
        hasSeekedRef.current = true;
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      if (onProgress) {
        onProgress(video.currentTime);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onCanPlay);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      if (onProgress && videoRef.current) {
        onProgress(videoRef.current.currentTime);
      }
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onCanPlay);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src, initialTime, onProgress]);

  // ---- Controls auto-hide ----
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        default:
          break;
      }
      showControlsTemporarily();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, isFullscreen, isMuted, volume, showControlsTemporarily]);

  // ---- Fullscreen change listener ----
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ---- Actions ----
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause();
    else v.play();
  }, [isPlaying]);

  const skip = useCallback((sec) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + sec));
  }, [duration]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const changeVolume = useCallback((val) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  }, []);

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const time = parseFloat(e.target.value);
    v.currentTime = time;
    setCurrentTime(time);
  };

  const handleProgressHover = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pct * duration);
    setHoverX(pct * 100);
  };

  const toggleFullscreen = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    if (!document.fullscreenElement) {
      if (c.requestFullscreen) c.requestFullscreen();
      else if (c.webkitRequestFullscreen) c.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }, []);

  // ---- Helpers ----
  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const VolumeIcon = () => {
    if (isMuted || volume === 0)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
        </svg>
      );
    if (volume < 0.5)
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 9v6h4l5 5V4L9 9H5zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
      );
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.playerContainer} ${showControls ? styles.controlsVisible : ""} player-container`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDoubleClick={toggleFullscreen}
      onClick={(e) => {
        // Only toggle play if not clicking a button
        if (e.target === containerRef.current || e.target === videoRef.current) {
          togglePlay();
          showControlsTemporarily();
        }
      }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className={styles.video}
        poster={poster}
        playsInline
        onClick={(e) => { e.stopPropagation(); togglePlay(); showControlsTemporarily(); }}
      />

      {/* Buffering spinner */}
      {isBuffering && <div className={styles.spinner} />}

      {/* Controls overlay */}
      <div className={`${styles.controlsOverlay} ${showControls ? styles.visible : ""}`}>
        <div className={styles.topGradient} />

        {/* TOP BAR */}
        <div className={styles.topBar}>
          <div className={styles.contentTitle}>
            {title || "NaruStream Premium"}
            {episode && <span>· {episode}</span>}
          </div>
          <div className={styles.topBadges}>
            <span className={styles.hdBadge}>HD</span>
            <span className={styles.premiumBadge}>⚡ PREMIUM</span>
          </div>
        </div>

        {/* CENTER CONTROLS */}
        <div className={styles.centerControls}>
          {/* Rewind 10s */}
          <button
            className={styles.skipBtn}
            onClick={(e) => { e.stopPropagation(); skip(-10); showControlsTemporarily(); }}
            title="Reculer 10 secondes"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3a9.5 9.5 0 1 0 7.07 15.9l-1.42-1.43A7.5 7.5 0 1 1 12.5 5L10 7.5l7 .5L16.5 1l-2.25 2.04A9.47 9.47 0 0 0 12.5 3z"/>
            </svg>
            <span className={styles.skipLabel}>10s</span>
          </button>

          {/* Play / Pause - Netflix big white circle */}
          <button
            className={styles.playPauseBtn}
            onClick={(e) => { e.stopPropagation(); togglePlay(); showControlsTemporarily(); }}
            title={isPlaying ? "Pause (K)" : "Lecture (K)"}
          >
            {isPlaying ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "3px" }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Forward 10s */}
          <button
            className={styles.skipBtn}
            onClick={(e) => { e.stopPropagation(); skip(10); showControlsTemporarily(); }}
            title="Avancer 10 secondes"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 3a9.47 9.47 0 0 0-2.25.27L7 1 7.5 8.5l7-.5L12 5a7.5 7.5 0 1 1-5.65 12.47L4.93 18.9A9.5 9.5 0 1 0 11.5 3z"/>
            </svg>
            <span className={styles.skipLabel}>10s</span>
          </button>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className={styles.bottomControls}>
          {/* Progress bar */}
          <div className={styles.progressSection}>
            <span className={styles.timeText}>{formatTime(currentTime)}</span>

            <div
              ref={progressRef}
              className={styles.progressWrapper}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
            >
              <div className={styles.progressTrack}>
                <div className={styles.progressBuffered} style={{ width: `${bufPct}%` }} />
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.progressThumb} style={{ left: `${pct}%` }} />

              {/* Hover tooltip */}
              {hoverTime !== null && (
                <div className={styles.progressTooltip} style={{ left: `${hoverX}%` }}>
                  {formatTime(hoverTime)}
                </div>
              )}

              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className={styles.progressInput}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <span className={styles.timeText}>{formatTime(duration)}</span>
          </div>

          {/* Controls bar */}
          <div className={styles.controlsBar}>
            {/* LEFT */}
            <div className={styles.leftControls}>
              {/* Play/Pause small */}
              <button
                className={styles.controlBtn}
                data-tooltip={isPlaying ? "Pause (K)" : "Lecture (K)"}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              >
                {isPlaying ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Volume - expand on hover */}
              <div className={styles.volumeGroup}>
                <button
                  className={styles.controlBtn}
                  data-tooltip={isMuted ? "Activer le son (M)" : "Couper le son (M)"}
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                >
                  <VolumeIcon />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => { e.stopPropagation(); changeVolume(parseFloat(e.target.value)); }}
                  onClick={(e) => e.stopPropagation()}
                  className={styles.volumeSlider}
                  title="Volume"
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className={styles.rightControls}>
              {/* Fullscreen */}
              <button
                className={`${styles.controlBtn} ${styles.fullscreenBtn}`}
                data-tooltip={isFullscreen ? "Quitter le plein écran (F)" : "Plein écran (F)"}
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              >
                {isFullscreen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
