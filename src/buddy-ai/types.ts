import { MemoryEmbedding } from "../models/memory-embedding";

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
}

export interface ChatResponse {
  text: string;
}

export type Embedding = number[];

export interface EmbedOptions {
  model?: string;
  dimensions?: number;
}

export interface RetrievedMemoryEmbedding extends MemoryEmbedding {
  similarity: number;
}