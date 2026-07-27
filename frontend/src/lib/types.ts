export type DocumentStatus = "processing" | "ready" | "failed";

export interface DocumentOut {
  id: string;
  filename: string;
  status: DocumentStatus;
  summary: string | null;
  chunk_count: number;
  created_at: string;
}

export interface SourceChunk {
  document_id: string;
  document_filename: string;
  chunk_index: number;
  text: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface ChatMessageOut {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ResearchResponse {
  synthesis: string;
  sources: ResearchSource[];
}

export interface ReportResponse {
  title: string;
  markdown: string;
}
