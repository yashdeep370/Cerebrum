"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, ChevronDown } from "lucide-react";
import {
  chatWithDocument,
  getChatHistory,
  libraryChat,
  getLibraryChatHistory,
  ApiError,
} from "@/lib/api";
import type { ChatMessageOut, SourceChunk } from "@/lib/types";

export type ChatScope = { type: "document"; documentId: string } | { type: "library" };

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
}

export default function ChatPanel({
  scope,
  placeholder = "Ask a question…",
  emptyLabel = "Ask a question about this document.",
}: {
  scope: ChatScope;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scopeKey = scope.type === "document" ? scope.documentId : "library";

  useEffect(() => {
    const fetchHistory = scope.type === "document" ? getChatHistory(scope.documentId) : getLibraryChatHistory();
    fetchHistory
      .then((history: ChatMessageOut[]) =>
        setMessages(history.map((m) => ({ id: m.id, role: m.role, content: m.content }))),
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isSending) return;

    setInput("");
    setError(null);
    setMessages((msgs) => [...msgs, { id: `local-${Date.now()}`, role: "user", content: question }]);
    setIsSending(true);

    try {
      const res =
        scope.type === "document" ? await chatWithDocument(scope.documentId, question) : await libraryChat(question);
      setMessages((msgs) => [
        ...msgs,
        { id: `local-${Date.now()}-a`, role: "assistant", content: res.answer, sources: res.sources },
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full border border-neutral-800 rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-[24rem] max-h-[32rem]">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-500 text-center my-auto">{emptyLabel}</p>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} showDocumentLabel={scope.type === "library"} />
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <Loader2 size={14} className="animate-spin" /> Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-2 text-sm text-red-400">{error}</p>}

      <div className="border-t border-neutral-800 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={placeholder}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  showDocumentLabel,
}: {
  message: DisplayMessage;
  showDocumentLabel: boolean;
}) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-indigo-600 text-white" : "bg-neutral-900 text-neutral-100 border border-neutral-800"
        }`}
      >
        {message.content}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-neutral-800/60">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
            >
              <ChevronDown size={12} className={showSources ? "rotate-180" : ""} />
              {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
            </button>
            {showSources && (
              <ul className="mt-1 flex flex-col gap-1">
                {message.sources.map((s, i) => (
                  <li
                    key={`${s.document_id}-${s.chunk_index}`}
                    className="text-xs text-neutral-500 bg-neutral-950/50 rounded p-2"
                  >
                    [{i + 1}] {showDocumentLabel && <span className="text-neutral-400">{s.document_filename}: </span>}
                    {s.text.slice(0, 200)}
                    {s.text.length > 200 ? "…" : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
