"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { uploadDocument, ApiError } from "@/lib/api";
import type { DocumentOut } from "@/lib/types";

export default function DocumentUpload({
  onUploaded,
}: {
  onUploaded: (doc: DocumentOut) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const doc = await uploadDocument(file);
      onUploaded(doc);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Is the backend running?");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-indigo-400 bg-indigo-500/5"
            : "border-neutral-800 hover:border-neutral-700"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-neutral-400">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
            <p className="text-sm">Uploading &amp; summarizing…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-400">
            <UploadCloud size={28} />
            <p className="text-sm">
              <span className="text-indigo-400 font-medium">Click to upload</span> or drag a PDF here
            </p>
            <p className="text-xs text-neutral-600">PDF, TXT, or MD</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
