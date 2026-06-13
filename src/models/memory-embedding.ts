export interface ProtoMemoryEmbedding {
    userId: string;
    memoryId: string;
    chunkIndex: number;
    chunkText: string;
    embedding: number[];
    embeddingModel: string;
}

export interface MemoryEmbedding extends ProtoMemoryEmbedding {
    id: string;
    createdAt: Date;
}