"use client";

import { useState } from "react";
import { Search, Loader2, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { runResearch, ApiError } from "@/lib/api";
import type { ResearchResponse } from "@/lib/types";

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await runResearch(q));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Research failed. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Research</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Ask about any topic — the agent searches the web and synthesizes a cited answer.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="What do you want to research?"
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm transition-colors"
        >
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Research
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="border border-neutral-800 rounded-lg p-4">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-neutral-100 prose-p:text-neutral-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.synthesis}</ReactMarkdown>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-neutral-300 mb-2">Sources</h2>
            <ul className="flex flex-col gap-2">
              {result.sources.map((s, i) => (
                <li key={s.url} className="border border-neutral-800 rounded-lg p-3">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-indigo-400 hover:underline"
                  >
                    [{i + 1}] {s.title}
                    <ExternalLink size={12} />
                  </a>
                  <p className="text-xs text-neutral-500 mt-1">{s.snippet}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
