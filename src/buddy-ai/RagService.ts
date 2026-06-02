import { Memory } from "../models/memory";

interface RagService {
  ingestMemory(userId: string, input: Memory): Promise<void>;
  //retrieveMemories(userId: string, query: string, filters: MemoryFilters): Promise<Memory[]>;
  //buildContextBlock(memories: Memory[]): string;
}
