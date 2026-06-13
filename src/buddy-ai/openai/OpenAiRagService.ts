import dotenv from 'dotenv';
import { RagService } from '../RagService';
import { MemoryInput } from '../types';
import { LlmProvider } from '../LlmProvider';
import { MemoryEmbedding, ProtoMemoryEmbedding } from '../../models/memory-embedding';
import { MemoryEmbeddingProvider } from '../../data-access/memory-embedding-provider';

dotenv.config();

const CHUNK_MAX_SIZE = 1000;
const CHUNK_OVERLAP = 250;

export class OpenAiRagService implements RagService {
    private readonly llmProvider: LlmProvider;

    constructor(options: {
        llmProvider: LlmProvider
    }) {
        this.llmProvider = options.llmProvider;
    }

    // Embed a memory, and create the rows in the memory_embeddings table.
    async embedMemory(userId: string, memoryId: string, input: MemoryInput): Promise<void> {
        let chunks = this.chunk(input.content);
        const embedResult = await this.llmProvider.embed(chunks);
        for (let i = 0; i < embedResult.embeddings.length; i++) {
            const memoryEmbedding: ProtoMemoryEmbedding = {
                userId: userId,
                memoryId: memoryId,
                chunkIndex: i,
                chunkText: embedResult.embeddings[i].chunk,
                embedding: embedResult.embeddings[i].embedding,
                embeddingModel: embedResult.embeddingModel,
            }
            await MemoryEmbeddingProvider.create(userId, memoryEmbedding);
        }
    }

    // Create a row in the memories table, then embed it.
    ingestMemory(userId: string, input: MemoryInput): Promise<void> {
        throw new Error('Method not implemented.');
    }

    chunk(content: string): string[] {
        if (content.length <= CHUNK_MAX_SIZE) {
            return [content];   // the common case: no splitting
        }

        let paragraphs = content.split('\n\n');
        let chunks = [];
        for (const paragraph of paragraphs) {
            if (paragraph.length < CHUNK_MAX_SIZE) {
                chunks.push(paragraph);
            } else {
                // Split each paragraph into 1000-char chunks
                let start = 0;
                let end;

                do {
                    end = start + CHUNK_MAX_SIZE;
                    let chunk = paragraph.substring(start, Math.min(end, paragraph.length));
                    chunks.push(chunk);
                    start = end - CHUNK_OVERLAP;
                } while (end < paragraph.length);
            }
        }

        return chunks;
    }
}