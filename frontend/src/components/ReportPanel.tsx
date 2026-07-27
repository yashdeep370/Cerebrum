"use client";

import { useState } from "react";
import { Download, FileOutput, Loader2, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateReport, ApiError } from "@/lib/api";

export default function ReportPanel({
  documentId,
  defaultTitle,
}: {
  documentId: string;
  defaultTitle: string;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeChatHistory, setIncludeChatHistory] = useState(true);
  const [researchQuery, setResearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setMarkdown(null);
    try {
      const res = await generateReport(documentId, {
        title,
        include_summary: includeSummary,
        include_chat_history: includeChatHistory,
        research_query: researchQuery.trim() || undefined,
      });
      setMarkdown(res.markdown);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Report generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownload() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase() || "report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportPdf() {
    window.print();
  }

  return (
    <div className="border border-neutral-800 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-neutral-100 font-medium text-sm">
        <FileOutput size={16} className="text-indigo-400" />
        Generate Report
      </div>

      <label className="text-xs text-neutral-500 flex flex-col gap-1">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500"
        />
      </label>

      <label className="text-xs text-neutral-500 flex flex-col gap-1">
        Include research on (optional)
        <input
          value={researchQuery}
          onChange={(e) => setResearchQuery(e.target.value)}
          placeholder="e.g. recent developments in this space"
          className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
        />
      </label>

      <div className="flex gap-4 text-xs text-neutral-400">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={includeSummary}
            onChange={(e) => setIncludeSummary(e.target.checked)}
          />
          Summary
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={includeChatHistory}
            onChange={(e) => setIncludeChatHistory(e.target.checked)}
          />
          Chat history
        </label>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !title.trim()}
        className="self-start flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm transition-colors"
      >
        {isGenerating && <Loader2 size={14} className="animate-spin" />}
        {isGenerating ? "Generating…" : "Generate"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {markdown && (
        <div className="mt-2 border-t border-neutral-800 pt-3">
          <div className="flex justify-end gap-3 mb-2">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-100"
            >
              <Printer size={13} /> Export PDF
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-100"
            >
              <Download size={13} /> Download .md
            </button>
          </div>
          <div
            id="report-print-area"
            className="prose prose-invert prose-sm max-w-none prose-headings:text-neutral-100 prose-p:text-neutral-300"
          >
            <h1 className="hidden print:block">{title}</h1>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
