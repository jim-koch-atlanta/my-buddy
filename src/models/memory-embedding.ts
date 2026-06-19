export interface ProtoMemoryEmbedding {
    memoryId: string;
    chunkIndex: number;
    chunkText: string;
    embedding: number[];
    embeddingModel: string;
}

export interface MemoryEmbedding extends ProtoMemoryEmbedding {
    id: string;
    userId: string;
    createdAt: Date;
}