"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import StatusBadge from "@/components/StatusBadge";
import ProgressBar from "@/components/ProgressBar";
import VideoPlayer from "@/components/VideoPlayer";
import { api, type Project } from "@/lib/api";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = parseInt(id);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [savingCaption, setSavingCaption] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadProject() {
    try {
      const data = await api.getProject(projectId);
      setProject(data);
      setEditTitle(data.title);
      setEditHashtags(data.hashtags);
      if (["READY", "FAILED"].includes(data.status) && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
    pollingRef.current = setInterval(loadProject, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [projectId]);

  async function handleRender() {
    if (!project) return;
    setRendering(true);
    setError(null);
    try {
      await api.renderProject(project.id);
      if (!pollingRef.current) {
        pollingRef.current = setInterval(loadProject, 3000);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRendering(false);
    }
  }

  async function handleSaveCaption() {
    if (!project) return;
    setSavingCaption(true);
    try {
      const updated = await api.updateCaption(project.id, editTitle, editHashtags);
      setProject(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingCaption(false);
    }
  }

  const isProcessing = project && ["DOWNLOADING","PROCESSING"].includes(project.status);
  const isReady = project?.status === "READY";
  const videoUrl = isReady && project.output_video_path ? api.storageUrl(project.output_video_path) : null;
  const thumbUrl = project?.thumbnail_path ? api.storageUrl(project.thumbnail_path) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 max-w-4xl mx-auto">
          <div className="skeleton h-10 w-48 rounded-xl mb-4" />
          <div className="skeleton h-64 rounded-2xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6 animate-fade-in flex-wrap">
          <button className="btn-ghost py-2 px-3 text-sm" onClick={() => router.push("/projects")}>
            Quay lai
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold">{project?.title || "Project #" + project?.id}</h1>
              {project && <StatusBadge status={project.status as any} />}
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
              {project?.source_url}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <div className="glass-card p-5 flex flex-col gap-3 animate-slide-up">
              <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Thong tin nguon
              </h2>
              {project && [
                { label: "Bat dau", value: project.start_time + "s" },
                { label: "Duration", value: project.duration + "s" },
                { label: "Preset", value: project.preset },
                { label: "Do phan giai", value: "720x1280 9:16" },
                { label: "Audio", value: project.audio_mode === "source" ? "Tu video nguon" : "Custom" },
              ].map((item) => (
                <div key={item.label} className="flex gap-2 text-sm">
                  <span className="shrink-0 font-semibold w-28" style={{ color: "var(--text-secondary)" }}>
                    {item.label}
                  </span>
                  <span className="truncate">{item.value}</span>
                </div>
              ))}
            </div>

            {isProcessing && project && (
              <div className="glass-card p-5 animate-slide-up">
                <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-secondary)" }}>
                  Dang xu ly
                </h2>
                <ProgressBar stage={project.progress_stage} progress={project.progress} />
              </div>
            )}

            {project?.status === "FAILED" && project.error_message && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(254,44,85,0.1)", color: "var(--tiktok-red)", border: "1px solid rgba(254,44,85,0.3)" }}>
                {project.error_message}
              </div>
            )}

            <div className="glass-card p-5 flex flex-col gap-3 animate-slide-up">
              <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Caption va Hashtag
              </h2>
              <div>
                <label className="form-label">Title</label>
                <input id="edit-title" type="text" className="input-field"
                  placeholder="Tieu de video..." value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Hashtags</label>
                <input id="edit-hashtags" type="text" className="input-field"
                  placeholder="#tiktok #fyp" value={editHashtags}
                  onChange={(e) => setEditHashtags(e.target.value)} />
              </div>
              <button className="btn-ghost text-sm py-2" onClick={handleSaveCaption} disabled={savingCaption}>
                {savingCaption ? "Dang luu..." : "Luu caption"}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(254,44,85,0.1)", color: "var(--tiktok-red)", border: "1px solid rgba(254,44,85,0.3)" }}>
                  {error}
                </div>
              )}
              {!isProcessing && project?.status !== "READY" && (
                <button id="render-btn" className="btn-primary py-4 text-base w-full"
                  onClick={handleRender} disabled={rendering}>
                  {rendering ? "Dang dua vao hang doi..." : "Create Video"}
                </button>
              )}
              {isReady && project && (
                <a id="download-btn" href={api.downloadUrl(project.id)} download
                  className="btn-primary py-4 text-base w-full text-center">
                  Tai MP4
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 animate-fade-in">
            {isReady && videoUrl && project ? (
              <>
                <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Preview
                </h2>
                <VideoPlayer
                  src={videoUrl}
                  thumbnailSrc={thumbUrl}
                  title={project.title}
                  hashtags={project.hashtags}
                  downloadUrl={api.downloadUrl(project.id)}
                />
              </>
            ) : (
              <div className="glass-card flex flex-col items-center justify-center text-center p-12 h-80">
                {isProcessing ? (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse-slow"
                      style={{ background: "rgba(77,111,255,0.2)" }}>⚙️</div>
                    <p className="font-bold">Dang render video...</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                      Preview se xuat hien khi hoan thanh.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-5xl mb-4">🎬</span>
                    <p className="font-bold">Chua co video</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                      Bam Create Video de bat dau render.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}