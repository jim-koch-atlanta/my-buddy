import { NewMemory } from "../models/memory";

export interface RagService {
  embedMemory(userId: string, memoryId: string, content: string): Promise<void>;
  ingestMemory(userId: string, newMemory: NewMemory): Promise<void>;
  //retrieveMemories(userId: string, query: string, filters: MemoryFilters): Promise<Memory[]>;
  //buildContextBlock(memories: Memory[]): string;
}
