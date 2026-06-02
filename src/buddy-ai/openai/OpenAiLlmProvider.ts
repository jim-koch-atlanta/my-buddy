import dotenv from 'dotenv';
import OpenAI from "openai";
import { LlmProvider } from '../LlmProvider';

dotenv.config();

export class OpenAiLlmProvider implements LlmProvider {
    private readonly client: OpenAI;
    private readonly defaultChatModel: string;
    private readonly defaultEmbeddingModel: string;

    constructor(options: {
        apiKey?: string;
        defaultChatModel?: string;
        defaultEmbeddingModel?: string;
    }) {
        this.client = new OpenAI({
            apiKey: options?.apiKey ?? process.env.OPENAI_API_KEY,
        })

        this.defaultChatModel = options?.defaultChatModel ?? "gpt-4o-mini";
        this.defaultEmbeddingModel = options?.defaultEmbeddingModel ?? "text-embedding-3-small";
    }

    async embed(texts: string[]): Promise<number[][]> {
        // OpenAI supports embedding multiple chunks at once.
        const response = await this.client.embeddings.create({
            input: texts,
            model: this.defaultEmbeddingModel
        })

        return response.data
            .sort((a, b) => a.index - b.index)
            .map((item) => item.embedding);
    }
    
}