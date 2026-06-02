export interface MemoryEmbedding {
    id: string;
    userId: string;
    memoryId: string;
    chunkIndex: number;
    chunkText: string;
    embedding: number[];
    embeddingModel: string;
    createdAt: Date;
}