import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(77,111,255,0.15) 0%, var(--bg-primary) 60%)" }}>
      <div className="text-center animate-fade-in max-w-2xl">
        {/* Logo / Hero */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "linear-gradient(135deg, var(--tiktok-red), #ff6b6b)" }}>
            🎬
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">TikTok Auto Video</h1>
            <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: "var(--tiktok-cyan)" }}>
              Video Tool
            </p>
          </div>
        </div>

        <p className="text-lg mb-10" style={{ color: "var(--text-secondary)" }}>
          Tự động hóa việc tạo video TikTok dọc 720×1280 —&nbsp;
          cắt video, chèn ảnh, render MP4, preview và tải xuống.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/dashboard" className="btn-primary text-base px-8 py-4">
            🚀 &nbsp; Mở Dashboard
          </Link>
          <Link href="/projects" className="btn-ghost text-base px-8 py-4">
            📂 &nbsp; Dự án của tôi
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-16">
          {[
            { icon: "✂️", label: "Cắt 30 giây" },
            { icon: "🖼️", label: "Chèn 2 ảnh" },
            { icon: "📐", label: "720×1280 9:16" },
            { icon: "🎵", label: "Audio nguồn" },
            { icon: "👁️", label: "Preview trực tiếp" },
            { icon: "⬇️", label: "Tải MP4" },
          ].map((f) => (
            <div key={f.label} className="glass-card p-4 flex flex-col items-center gap-2">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
