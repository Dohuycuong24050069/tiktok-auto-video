"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "⚡", label: "Dashboard" },
  { href: "/projects",  icon: "📂", label: "Dự án" },
  { href: "/settings",  icon: "⚙️",  label: "Cài đặt" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 p-4 border-r"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "linear-gradient(135deg,var(--tiktok-red),#ff6b6b)" }}>🎬</div>
        <div>
          <p className="font-extrabold text-sm leading-tight">TikTok Auto</p>
          <p className="text-xs" style={{ color: "var(--tiktok-cyan)" }}>Video Tool</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
av-item}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="glass-card p-4 text-center">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>MVP v1.0.0</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Local • FFmpeg • SQLite</p>
        </div>
      </div>
    </aside>
  );
}
