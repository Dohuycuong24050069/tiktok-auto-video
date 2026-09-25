"use client";
import { useRef, useState, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
  thumbnailSrc?: string | null;
  title?: string;
  hashtags?: string;
  downloadUrl?: string;
}

export default function VideoPlayer({ src, thumbnailSrc, title, hashtags, downloadUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setProgress(v.currentTime / (v.duration || 1));
    const onMeta = () => setDuration(v.duration);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("loadedmetadata", onMeta); };
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = +e.target.value * v.duration;
    setProgress(+e.target.value);
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const val = +e.target.value;
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function fullscreen() {
    videoRef.current?.requestFullscreen?.();
  }

  function fmt(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return ${m}:;
  }

  return (
    <div className="w-full max-w-xs mx-auto animate-fade-in">
      {/* 9:16 Frame */}
      <div className="preview-frame mx-auto relative" style={{ maxWidth: 280 }}>
        <video
          ref={videoRef}
          src={src}
          poster={thumbnailSrc || undefined}
          className="w-full h-full object-contain bg-black"
          playsInline
          onClick={togglePlay}
        />
        {/* Overlay play indicator */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
              ▶️
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="glass-card mt-4 p-4 flex flex-col gap-3">
        {/* Timeline */}
        <div className="flex items-center gap-2 text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
          <span>{fmt(progress * duration)}</span>
          <input type="range" className="flex-1" min={0} max={1} step={0.001}
            value={progress} onChange={seek} />
          <span>{fmt(duration)}</span>
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="btn-ghost px-3 py-2 text-lg">
              {playing ? "⏸" : "▶️"}
            </button>
            <button onClick={toggleMute} className="btn-ghost px-3 py-2 text-sm">
              {muted || volume === 0 ? "🔇" : "🔊"}
            </button>
            <input type="range" className="w-16" min={0} max={1} step={0.05}
              value={muted ? 0 : volume} onChange={changeVolume} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fullscreen} className="btn-ghost px-3 py-2 text-sm">⛶</button>
            {downloadUrl && (
              <a href={downloadUrl} download className="btn-primary px-4 py-2 text-sm">
                ⬇️ MP4
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Caption area */}
      {(title || hashtags) && (
        <div className="glass-card mt-4 p-4">
          {title && <p className="font-bold text-base mb-2">{title}</p>}
          {hashtags && (
            <p className="text-sm" style={{ color: "var(--tiktok-cyan)" }}>
              {hashtags.split(" ").filter(Boolean).map((h, i) => (
                <span key={i} className="mr-2">{h.startsWith("#") ? h : #}</span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
