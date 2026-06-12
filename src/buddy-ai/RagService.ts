import { MemoryInput } from "./types";

export interface RagService {
  embedMemory(userId: string, input: MemoryInput): Promise<void>;
  ingestMemory(userId: string, input: MemoryInput): Promise<void>;
  //retrieveMemories(userId: string, query: string, filters: MemoryFilters): Promise<Memory[]>;
  //buildContextBlock(memories: Memory[]): string;
}
