import { NewMemory, Memory } from "../models/memory";
import { MemoryFilters } from "../data-access/memory-filters/memory-filters";

export interface RagService {
  embedMemory(userId: string, memoryId: string, content: string): Promise<void>;
  ingestMemory(userId: string, newMemory: NewMemory): Promise<void>;
  retrieveMemories(userId: string, query: string, filters: MemoryFilters, limit: number): Promise<Memory[]>;
  buildContextBlock(memories: Memory[]): string;
}
