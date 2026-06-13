import { Embedding, EmbedOptions } from "./types";

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

export interface LlmProvider {
  embed(texts: string[], options?: EmbedOptions): Promise<EmbedResult>;
  //generateStructured<T>(prompt: PromptParts, schema: JsonSchema): Promise<T>;
}
