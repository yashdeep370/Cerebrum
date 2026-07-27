"use client";

import ChatPanel from "@/components/ChatPanel";

export default function LibraryChatPage() {
  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-10 flex flex-col gap-6 flex-1">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Chat</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Ask questions across your whole document library at once.
        </p>
      </div>
      <ChatPanel
        scope={{ type: "library" }}
        placeholder="Ask something about any of your documents…"
        emptyLabel="Ask a question — I'll search across everything you've uploaded."
      />
    </div>
  );
}
