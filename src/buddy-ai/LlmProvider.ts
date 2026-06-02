export interface LlmProvider {
  embed(texts: string[]): Promise<number[][]>;
  //generateStructured<T>(prompt: PromptParts, schema: JsonSchema): Promise<T>;
}
