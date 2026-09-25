export type ProjectStatus = "PENDING" | "DOWNLOADING" | "PROCESSING" | "READY" | "FAILED";

const labels: Record<ProjectStatus, string> = {
  PENDING: "Chờ xử lý",
  DOWNLOADING: "Đang tải",
  PROCESSING: "Đang xử lý",
  READY: "Hoàn thành",
  FAILED: "Thất bại",
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const cls = adge badge-;
  const dot = {
    PENDING: "⏸",
    DOWNLOADING: "⬇️",
    PROCESSING: "⚙️",
    READY: "✅",
    FAILED: "❌",
  }[status];
  return <span className={cls}>{dot} {labels[status]}</span>;
}
