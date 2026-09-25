interface ProgressBarProps {
  stage: string;
  progress: number;
}

const STAGE_LABELS: Record<string, string> = {
  DOWNLOADING: "Đang tải video nguồn",
  PROCESSING: "Đang xử lý",
  RENDERING: "Đang render",
  DONE: "Hoàn thành",
  FAILED: "Thất bại",
};

export default function ProgressBar({ stage, progress }: ProgressBarProps) {
  const pct = Math.round(progress * 100);
  const label = STAGE_LABELS[stage] || stage;
  return (
    <div className="w-full animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--tiktok-cyan)" }}>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: ${pct}% }} />
      </div>
    </div>
  );
}
