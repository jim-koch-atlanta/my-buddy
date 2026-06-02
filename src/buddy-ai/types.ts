// ai/types.ts

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

export interface MemoryEmbedding {
  id: string;
  userId: string;
  memoryId: string;
  chunkIndex: number;
  chunkText: string;
  embedding: Embedding;
  embeddingModel: string;
  createdAt: Date;
}

export interface RetrievedMemoryEmbedding extends MemoryEmbedding {
  similarity: number;
}