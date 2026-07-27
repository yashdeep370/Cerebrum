import type { DocumentStatus } from "@/lib/types";

const styles: Record<DocumentStatus, string> = {
  ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  processing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
}
