interface RagService {
  ingestMemory(userId: string, input: MemoryInput): Promise<void>;
  retrieveMemories(userId: string, query: string, filters: MemoryFilters): Promise<Memory[]>;
  buildContextBlock(memories: Memory[]): string;
}
