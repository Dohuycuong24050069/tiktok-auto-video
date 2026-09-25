"use client";
import { useRef, useState } from "react";

interface ImageUploadCardProps {
  label: string;
  file: File | null;
  preview: string | null;
  onFile: (f: File | null) => void;
  startTime: number;
  endTime: number;
  position: string;
  size: number;
  opacity: number;
  onStartTime: (v: number) => void;
  onEndTime: (v: number) => void;
  onPosition: (v: string) => void;
  onSize: (v: number) => void;
  onOpacity: (v: number) => void;
  duration: number;
}

const POSITIONS = [
  "top-left","top-center","top-right",
  "center",
  "bottom-left","bottom-center","bottom-right",
];

export default function ImageUploadCard(props: ImageUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Chỉ chấp nhận file ảnh (JPEG/PNG/WebP).");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      alert("File ảnh vượt quá 20 MB.");
      return;
    }
    props.onFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {props.label}
      </h3>

      {/* Drop zone */}
      <div
        className={upload-zone}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}>
        {props.preview ? (
          <img src={props.preview} alt="preview" className="max-h-32 rounded-lg object-contain" />
        ) : (
          <>
            <span className="text-3xl">🖼️</span>
            <p className="text-xs mt-2 font-medium" style={{ color: "var(--text-secondary)" }}>
              Kéo thả hoặc click để chọn ảnh
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>PNG/JPG/WebP · max 20 MB</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      </div>

      {props.file && (
        <button className="btn-ghost text-xs py-1.5" onClick={() => props.onFile(null)}>
          🗑️ Xoá ảnh
        </button>
      )}

      {/* Settings grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="form-label">Bắt đầu (s)</label>
          <input type="number" className="input-field text-sm" min={0} max={props.duration}
            value={props.startTime} onChange={(e) => props.onStartTime(+e.target.value)} />
        </div>
        <div>
          <label className="form-label">Kết thúc (s)</label>
          <input type="number" className="input-field text-sm" min={0} max={props.duration}
            value={props.endTime} onChange={(e) => props.onEndTime(+e.target.value)} />
        </div>
      </div>

      <div>
        <label className="form-label">Vị trí</label>
        <select className="select-field text-sm" value={props.position}
          onChange={(e) => props.onPosition(e.target.value)}>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Kích thước — {Math.round(props.size * 100)}%</label>
        <input type="range" className="w-full" min={0.05} max={0.9} step={0.05}
          value={props.size} onChange={(e) => props.onSize(+e.target.value)} />
      </div>

      <div>
        <label className="form-label">Độ mờ — {Math.round(props.opacity * 100)}%</label>
        <input type="range" className="w-full" min={0.1} max={1.0} step={0.05}
          value={props.opacity} onChange={(e) => props.onOpacity(+e.target.value)} />
      </div>
    </div>
  );
}
