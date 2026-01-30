import React, { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause, FaVolumeUp, FaEllipsisV, FaDownload } from "react-icons/fa";

function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AudioPlayer({ src, className = "", autoPlay = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrent(a.currentTime || 0);
    const onEnded = () => setIsPlaying(false);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [autoPlay, src]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const onSeek = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const val = Number(e.target.value);
    a.currentTime = val;
    setCurrent(val);
  };

  const onVolume = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const val = Number(e.target.value);
    a.volume = val;
    setVolume(val);
  };

  const toggleMenu = () => setShowMenu(v => !v);
  const changeSpeed = (rate) => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = rate;
    setPlaybackRate(rate);
    setShowMenu(false);
  };
  const onDownload = () => {
    if (!src) return;
    const link = document.createElement("a");
    link.href = src;
    link.download = "audio.wav";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowMenu(false);
  };

  return (
    <div className={`audio-player-custom ${className}`}> 
      <audio ref={audioRef} src={src} preload="metadata" />
      <span
        className="ap-playicon"
        role="button"
        tabIndex={0}
        onClick={togglePlay}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            togglePlay();
          }
        }}
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </span>
      <div className="ap-timeline">
        <span className="ap-time">{formatTime(current)}</span>
        <input
          className="ap-seek"
          type="range"
          min={0}
          max={Math.max(duration, 0)}
          step={0.01}
          value={current}
          onChange={onSeek}
        />
        <span className="ap-time">{formatTime(duration)}</span>
      </div>
      <div className="ap-volume">
        <span className="ap-icon"><FaVolumeUp /></span>
        <input
          className="ap-volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={onVolume}
        />
      </div>
      <div className="ap-more" aria-label="Más opciones">
        <span
          className="ap-moreicon"
          role="button"
          tabIndex={0}
          onClick={toggleMenu}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleMenu();
            }
          }}
          aria-haspopup="true"
          aria-expanded={showMenu}
        >
          <FaEllipsisV />
        </span>
        {showMenu && (
          <div className="ap-menu">
            <div className="ap-menu-header">Velocidad</div>
            <div className="ap-menu-row">
              {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                <button
                  key={rate}
                  className={`ap-menu-item ${playbackRate === rate ? "active" : ""}`}
                  onClick={() => changeSpeed(rate)}
                >
                  {rate}x
                </button>
              ))}
            </div>
            <hr className="ap-menu-sep" />
            <button className="ap-menu-item" onClick={onDownload}>
              <FaDownload style={{ marginRight: 6 }} /> Descargar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
