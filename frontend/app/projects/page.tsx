"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import ProjectCard from "@/components/ProjectCard";
import { api, type Project } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: projects.length,
    ready: projects.filter((p) => p.status === "READY").length,
    processing: projects.filter((p) => ["DOWNLOADING","PROCESSING"].includes(p.status)).length,
    failed: projects.filter((p) => p.status === "FAILED").length,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-extrabold">📂 Dự án</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {stats.total} projects · {stats.ready} sẵn sàng · {stats.processing} đang xử lý
            </p>
          </div>
          <Link href="/dashboard" className="btn-primary">
            ＋ Mới
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Tổng", value: stats.total, color: "var(--text-primary)" },
            { label: "Hoàn thành", value: stats.ready, color: "#4ade80" },
            { label: "Đang xử lý", value: stats.processing, color: "var(--tiktok-cyan)" },
            { label: "Thất bại", value: stats.failed, color: "var(--tiktok-red)" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Project list */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[0,1,2].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: "rgba(254,44,85,0.1)", color: "var(--tiktok-red)", border: "1px solid rgba(254,44,85,0.3)" }}>
            ❌ {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="glass-card p-12 flex flex-col items-center gap-4 text-center">
            <span className="text-5xl">🎬</span>
            <p className="font-bold text-xl">Chưa có project nào</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Tạo project đầu tiên để bắt đầu tạo video TikTok tự động.
            </p>
            <Link href="/dashboard" className="btn-primary mt-2">🚀 Tạo ngay</Link>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="flex flex-col gap-3 animate-slide-up">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDeleted={load} />
            ))}
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}
