"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { checkPassword } from "@/lib/api";
import { getStoredPassword, setStoredPassword } from "@/lib/auth";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">("checking");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredPassword();
    checkPassword(stored)
      .then((ok) => setStatus(ok ? "unlocked" : "locked"))
      .catch(() => setStatus("locked"));
  }, []);

  async function handleSubmit() {
    setError(null);
    const ok = await checkPassword(input).catch(() => false);
    if (ok) {
      setStoredPassword(input);
      setStatus("unlocked");
    } else {
      setError("Incorrect password.");
    }
  }

  if (status === "checking") {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-neutral-500">Loading…</div>
    );
  }

  if (status === "locked") {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-xs flex flex-col gap-3 p-6 border border-neutral-800 rounded-lg">
          <div className="flex items-center gap-2 text-neutral-100">
            <Lock size={16} className="text-indigo-400" />
            <h1 className="text-base font-medium">Cerebrum</h1>
          </div>
          <p className="text-sm text-neutral-500">Enter the access password to continue.</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={handleSubmit}
            className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm transition-colors"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
