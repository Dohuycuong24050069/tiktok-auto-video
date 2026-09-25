"use client";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/lib/api";
import { api } from "@/lib/api";
import StatusBadge from "./StatusBadge";

interface ProjectCardProps {
  project: Project;
  onDeleted: () => void;
}

export default function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Xoá project này?")) return;
    setDeleting(true);
    try {
      await api.deleteProject(project.id);
      onDeleted();
    } catch {
      alert("Không thể xoá project.");
      setDeleting(false);
    }
  }

  const thumb = api.storageUrl(project.thumbnail_path);
  const timeAgo = new Date(project.created_at).toLocaleString("vi-VN");

  return (
    <Link href={/projects/} className="glass-card p-4 flex gap-4 hover:border-opacity-30 transition-all duration-200 group"
      style={{ borderColor: "var(--border)" }}>
      {/* Thumbnail */}
      <div className="shrink-0 w-16 h-28 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
        {thumb ? (
          <img src={thumb} alt="thumbnail" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🎬</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm truncate">{project.title || Project #}</p>
          <StatusBadge status={project.status as any} />
        </div>
        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
          {project.source_url}
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          ✂️ {project.start_time}s · ⏱ {project.duration}s · 📐 9:16
        </p>
        {project.status === "PROCESSING" || project.status === "DOWNLOADING" ? (
          <div className="progress-track mt-1">
            <div className="progress-fill" style={{ width: ${Math.round(project.progress * 100)}% }} />
          </div>
        ) : null}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{timeAgo}</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            🗑️
          </button>
        </div>
      </div>
    </Link>
  );
}
