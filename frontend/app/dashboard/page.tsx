"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import ImageUploadCard from "@/components/ImageUploadCard";
import { api } from "@/lib/api";

const PRESETS = [
  { id: "short_20s", label: "Short 20s", duration: 20 },
  { id: "short_30s", label: "Short 30s", duration: 30 },
  { id: "short_45s", label: "Short 45s", duration: 45 },
  { id: "short_60s", label: "Short 60s", duration: 60 },
];

export default function DashboardPage() {
  const router = useRouter();

  // Source
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [preset, setPreset] = useState("short_30s");
  const [duration, setDuration] = useState(30);
  const [audioMode] = useState("source");

  // Images
  const [img1File, setImg1File] = useState<File | null>(null);
  const [img1Preview, setImg1Preview] = useState<string | null>(null);
  const [img1Start, setImg1Start] = useState(0);
  const [img1End, setImg1End] = useState(3);
  const [img1Pos, setImg1Pos] = useState("top-center");
  const [img1Size, setImg1Size] = useState(0.3);
  const [img1Opacity, setImg1Opacity] = useState(1.0);

  const [img2File, setImg2File] = useState<File | null>(null);
  const [img2Preview, setImg2Preview] = useState<string | null>(null);
  const [img2Start, setImg2Start] = useState(27);
  const [img2End, setImg2End] = useState(30);
  const [img2Pos, setImg2Pos] = useState("bottom-center");
  const [img2Size, setImg2Size] = useState(0.3);
  const [img2Opacity, setImg2Opacity] = useState(1.0);

  // Caption
  const [title, setTitle] = useState("");
  const [hashtags, setHashtags] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setPresetByKey(key: string) {
    setPreset(key);
    const p = PRESETS.find((x) => x.id === key);
    if (p) {
      setDuration(p.duration);
      setImg2Start(p.duration - 3);
      setImg2End(p.duration);
    }
  }

  function handleImg(idx: 1 | 2, f: File | null) {
    if (idx === 1) {
      setImg1File(f);
      setImg1Preview(f ? URL.createObjectURL(f) : null);
    } else {
      setImg2File(f);
      setImg2Preview(f ? URL.createObjectURL(f) : null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!url.trim()) { setError("Vui lòng nhập YouTube URL."); return; }
    if (duration < 5 || duration > 180) { setError("Duration phải từ 5 đến 180 giây."); return; }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("source_url", url.trim());
      form.append("start_time", String(startTime));
      form.append("duration", String(duration));
      form.append("preset", preset);
      form.append("audio_mode", audioMode);
      form.append("title", title);
      form.append("hashtags", hashtags);
      form.append("image1_start", String(img1Start));
      form.append("image1_end", String(img1End));
      form.append("image1_position", img1Pos);
      form.append("image1_size", String(img1Size));
      form.append("image1_opacity", String(img1Opacity));
      form.append("image2_start", String(img2Start));
      form.append("image2_end", String(img2End));
      form.append("image2_position", img2Pos);
      form.append("image2_size", String(img2Size));
      form.append("image2_opacity", String(img2Opacity));
      if (img1File) form.append("image1", img1File);
      if (img2File) form.append("image2", img2File);

      const project = await api.createProject(form);
      router.push(/projects/);
    } catch (err: any) {
      setError(err.message || "Không thể tạo project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto w-full">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-extrabold">✨ Project mới</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Điền thông tin video, upload ảnh rồi bấm Create Video.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-slide-up">
          {/* ── Source ─────────────────────────────────── */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h2 className="font-bold text-base">📹 Nguồn video</h2>

            <div>
              <label className="form-label">YouTube URL *</label>
              <input
                id="source-url"
                type="url"
                className="input-field"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start time (s)</label>
                <input id="start-time" type="number" className="input-field" min={0} step={1}
                  value={startTime} onChange={(e) => setStartTime(+e.target.value)} />
              </div>
              <div>
                <label className="form-label">Preset</label>
                <select id="preset-select" className="select-field" value={preset}
                  onChange={(e) => setPresetByKey(e.target.value)}>
                  {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Duration (s)</label>
                <input id="duration-input" type="number" className="input-field" min={5} max={180}
                  value={duration} onChange={(e) => setDuration(+e.target.value)} />
              </div>
              <div>
                <label className="form-label">Quality</label>
                <input type="text" className="input-field" value="720p · 9:16" readOnly
                  style={{ opacity: 0.6 }} />
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--bg-elevated)" }}>
              <span>🎵</span>
              <span>Audio: <strong>Từ video nguồn (mặc định)</strong></span>
            </div>
          </div>

          {/* ── Images ─────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-4">
            <ImageUploadCard
              label="🖼️ Image 1 (0–3s)"
              file={img1File} preview={img1Preview} onFile={(f) => handleImg(1, f)}
              startTime={img1Start} endTime={img1End} position={img1Pos}
              size={img1Size} opacity={img1Opacity} duration={duration}
              onStartTime={setImg1Start} onEndTime={setImg1End} onPosition={setImg1Pos}
              onSize={setImg1Size} onOpacity={setImg1Opacity}
            />
            <ImageUploadCard
              label="🖼️ Image 2 (cuối 3s)"
              file={img2File} preview={img2Preview} onFile={(f) => handleImg(2, f)}
              startTime={img2Start} endTime={img2End} position={img2Pos}
              size={img2Size} opacity={img2Opacity} duration={duration}
              onStartTime={setImg2Start} onEndTime={setImg2End} onPosition={setImg2Pos}
              onSize={setImg2Size} onOpacity={setImg2Opacity}
            />
          </div>

          {/* ── Caption ─────────────────────────────────── */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h2 className="font-bold text-base">✍️ Caption & Hashtag</h2>
            <div>
              <label className="form-label">Title / Caption</label>
              <input id="title-input" type="text" className="input-field"
                placeholder="Nhập tiêu đề video..." value={title}
                onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Hashtags</label>
              <input id="hashtags-input" type="text" className="input-field"
                placeholder="#tiktok #viral #fyp" value={hashtags}
                onChange={(e) => setHashtags(e.target.value)} />
            </div>
          </div>

          {/* ── Error ─────────────────────────────────── */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: "rgba(254,44,85,0.1)", color: "var(--tiktok-red)", border: "1px solid rgba(254,44,85,0.3)" }}>
              ❌ {error}
            </div>
          )}

          {/* ── Submit ─────────────────────────────────── */}
          <button id="create-video-btn" type="submit" disabled={loading}
            className="btn-primary text-base py-4 w-full">
            {loading ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang tạo project...
              </span>
            ) : "🚀 Create Video"}
          </button>
        </form>
      </main>
      <MobileNav />
    </div>
  );
}
