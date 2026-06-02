import dotenv from 'dotenv';
import OpenAI from "openai";
import { LlmProvider } from '../LlmProvider';
import { Embedding, EmbedOptions } from '../types';

dotenv.config();

export class OpenAiLlmProvider implements LlmProvider {
    private readonly client: OpenAI;
    private readonly defaultChatModel: string;
    private readonly defaultEmbeddingModel: string;
    private readonly defaultEmbeddingDimensions: number;

    constructor(options: {
        apiKey?: string;
        defaultChatModel?: string;
        defaultEmbeddingModel?: string;
        defaultEmbeddingDimensions?: number;
    }) {
        this.client = new OpenAI({
            apiKey: options?.apiKey ?? process.env.OPENAI_API_KEY,
        })

        this.defaultChatModel = options?.defaultChatModel ?? "gpt-4o-mini";
        this.defaultEmbeddingModel = options?.defaultEmbeddingModel ?? "text-embedding-3-small";
        this.defaultEmbeddingDimensions = options?.defaultEmbeddingDimensions ?? 1536;
    }

    async embed(texts: string[], options?: EmbedOptions): Promise<Embedding[]> {
        // OpenAI supports embedding multiple chunks at once.
        const response = await this.client.embeddings.create({
            input: texts,
            model: options?.model ?? this.defaultEmbeddingModel,
            dimensions: options?.dimensions ?? this.defaultEmbeddingDimensions,
        })

        return response.data
            .sort((a, b) => a.index - b.index)
            .map((item) => item.embedding);
    }    
}