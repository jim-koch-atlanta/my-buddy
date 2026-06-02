import { Embedding } from "./types";

export interface LlmProvider {
  embed(texts: string[]): Promise<Embedding[]>;
  //generateStructured<T>(prompt: PromptParts, schema: JsonSchema): Promise<T>;
}
