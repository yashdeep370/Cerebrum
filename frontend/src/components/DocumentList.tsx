"use client";

import Link from "next/link";
import { Trash2, FileText } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { DocumentOut } from "@/lib/types";

export default function DocumentList({
  documents,
  onDelete,
}: {
  documents: DocumentOut[];
  onDelete: (id: string) => void;
}) {
  if (documents.length === 0) {
    return (
      <p className="text-center text-neutral-500 text-sm py-12">
        No documents yet. Upload one to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-900/50">
          <FileText size={18} className="text-neutral-500 shrink-0" />
          <Link href={`/documents/${doc.id}`} className="flex-1 min-w-0">
            <p className="text-sm text-neutral-100 truncate">{doc.filename}</p>
            <p className="text-xs text-neutral-500">
              {doc.chunk_count} chunks · {new Date(doc.created_at).toLocaleString()}
            </p>
          </Link>
          <StatusBadge status={doc.status} />
          <button
            onClick={() => onDelete(doc.id)}
            className="text-neutral-600 hover:text-red-400 transition-colors p-1"
            aria-label="Delete document"
          >
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
