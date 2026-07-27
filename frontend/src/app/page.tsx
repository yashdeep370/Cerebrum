"use client";

import { useEffect, useState } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import { deleteDocument, listDocuments } from "@/lib/api";
import type { DocumentOut } from "@/lib/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => setError("Couldn't reach the backend. Is it running on port 8000?"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDocuments((docs) => docs.filter((d) => d.id !== id));
    await deleteDocument(id).catch(() => {
      // best-effort; a stale row is a minor issue compared to a blocked UI
    });
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Documents</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Upload a document to summarize it and start asking questions.
        </p>
      </div>

      <DocumentUpload onUploaded={(doc) => setDocuments((docs) => [doc, ...docs])} />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <DocumentList documents={documents} onDelete={handleDelete} />
      )}
    </div>
  );
}
