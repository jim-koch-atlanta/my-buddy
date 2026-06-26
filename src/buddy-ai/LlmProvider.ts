import { ChatMessage, ChatOptions, Embedding, EmbedOptions } from "./types";
import { z } from 'zod/v4';

// One input chunk paired with the embedding that was produced for it.
export interface ChunkEmbedding {
  chunk: string;
  embedding: Embedding;
}

// The result of an embed() call: every chunk/embedding pair, plus the model
// that actually produced them (so callers can record embedding_model honestly).
export interface EmbedResult {
  embeddings: ChunkEmbedding[];
  embeddingModel: string;
}

// The result of a generate() call, along with the model and the number of tokens.
export interface GenerateResult<T> {
  data: T;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

// Definition for the schemas for structured output.
export type AnyZodObject = z.ZodObject<z.ZodRawShape>;

export interface LlmProvider {
  embed(texts: string[], options?: EmbedOptions): Promise<EmbedResult>;
  generateStructured<S extends z.ZodType>(
    messages: ChatMessage[],
    outputSchema: S,
    options?: ChatOptions,
  ): Promise<GenerateResult<z.infer<S>>>;
}
