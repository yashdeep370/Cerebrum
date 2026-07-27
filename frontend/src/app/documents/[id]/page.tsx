"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import ReportPanel from "@/components/ReportPanel";
import StatusBadge from "@/components/StatusBadge";
import { getDocument } from "@/lib/api";
import type { DocumentOut } from "@/lib/types";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [doc, setDoc] = useState<DocumentOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocument(id)
      .then(setDoc)
      .catch(() => setError("Document not found."));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl w-full px-4 py-10">
        <p className="text-sm text-red-400">{error}</p>
        <Link href="/" className="text-sm text-indigo-400 hover:underline mt-2 inline-block">
          Back to documents
        </Link>
      </div>
    );
  }

  if (!doc) {
    return <p className="mx-auto max-w-3xl w-full px-4 py-10 text-sm text-neutral-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-10 flex flex-col gap-6">
      <div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 mb-3"
        >
          <ArrowLeft size={14} /> Documents
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-neutral-100">{doc.filename}</h1>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      {doc.summary && (
        <div className="border border-neutral-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-neutral-100 mb-2">Summary</h2>
          <p className="text-sm text-neutral-400 whitespace-pre-wrap">{doc.summary}</p>
        </div>
      )}

      {doc.status === "ready" ? (
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <ChatPanel scope={{ type: "document", documentId: doc.id }} />
          <ReportPanel documentId={doc.id} defaultTitle={doc.filename} />
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          {doc.status === "processing"
            ? "This document is still processing."
            : "This document failed to process — try re-uploading it."}
        </p>
      )}
    </div>
  );
}
