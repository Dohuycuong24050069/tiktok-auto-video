"use client";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function SettingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto w-full">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-extrabold">Cai dat</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Cau hinh he thong va ket noi.
          </p>
        </div>

        <div className="flex flex-col gap-6 animate-slide-up">
          {/* System info */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h2 className="font-bold">He thong</h2>
            {[
              { label: "Backend API", value: apiUrl },
              { label: "Database", value: "SQLite (local)" },
              { label: "Storage", value: "Local filesystem" },
              { label: "Video codec", value: "H.264 / libx264" },
              { label: "Audio codec", value: "AAC" },
              { label: "Resolution", value: "720x1280 (9:16)" },
            ].map((item) => (
              <div key={item.label} className="flex gap-2 text-sm">
                <span className="shrink-0 font-semibold w-36" style={{ color: "var(--text-secondary)" }}>
                  {item.label}
                </span>
                <span className="font-mono text-xs" style={{ color: "var(--tiktok-cyan)" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* TikTok (future) */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h2 className="font-bold">TikTok Publishing</h2>
            <div className="rounded-xl p-4 text-sm"
              style={{ background: "rgba(77,111,255,0.08)", border: "1px solid rgba(77,111,255,0.2)" }}>
              <p className="font-semibold mb-1" style={{ color: "#6b8fff" }}>Tinh nang dang bai TikTok</p>
              <p style={{ color: "var(--text-secondary)" }}>
                Tinh nang nay se su dung TikTok OAuth chinh thuc (Content Posting API).
                Hien tai MVP chi ho tro tai MP4 ve may.
              </p>
            </div>
            <button className="btn-ghost py-3 opacity-50 cursor-not-allowed" disabled>
              Ket noi TikTok (sap ra mat)
            </button>
          </div>

          {/* Quick links */}
          <div className="glass-card p-6 flex flex-col gap-3">
            <h2 className="font-bold">Lien ket nhanh</h2>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="btn-ghost py-2 text-sm">
              API Docs (Swagger UI)
            </a>
            <a href="http://localhost:8000/health" target="_blank" rel="noreferrer" className="btn-ghost py-2 text-sm">
              Health Check
            </a>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
