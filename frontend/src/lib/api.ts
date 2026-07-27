import type {
  ChatMessageOut,
  ChatResponse,
  DocumentOut,
  ReportResponse,
  ResearchResponse,
} from "./types";
import { getStoredPassword } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const password = getStoredPassword();
  if (password) headers.set("Authorization", `Bearer ${password}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.detail ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function checkPassword(password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/check`, {
    headers: { Authorization: `Bearer ${password}` },
  });
  return res.ok;
}

export function listDocuments(): Promise<DocumentOut[]> {
  return request("/documents");
}

export function getDocument(id: string): Promise<DocumentOut> {
  return request(`/documents/${id}`);
}

export function uploadDocument(file: File): Promise<DocumentOut> {
  const formData = new FormData();
  formData.append("file", file);
  return request("/documents", { method: "POST", body: formData });
}

export function deleteDocument(id: string): Promise<void> {
  return request(`/documents/${id}`, { method: "DELETE" });
}

export function chatWithDocument(id: string, question: string): Promise<ChatResponse> {
  return request(`/documents/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}

export function getChatHistory(id: string): Promise<ChatMessageOut[]> {
  return request(`/documents/${id}/messages`);
}

export function libraryChat(question: string): Promise<ChatResponse> {
  return request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}

export function getLibraryChatHistory(): Promise<ChatMessageOut[]> {
  return request("/chat/messages");
}

export function runResearch(query: string, maxResults = 5): Promise<ResearchResponse> {
  return request("/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, max_results: maxResults }),
  });
}

export function generateReport(
  documentId: string,
  options: {
    title: string;
    include_summary: boolean;
    include_chat_history: boolean;
    research_query?: string;
  },
): Promise<ReportResponse> {
  return request(`/documents/${documentId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
}
