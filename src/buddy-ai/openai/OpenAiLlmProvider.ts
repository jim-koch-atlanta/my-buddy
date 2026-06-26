import dotenv from 'dotenv';
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from 'zod/v4';

import { EmbedResult, GenerateResult, LlmProvider } from '../LlmProvider';
import { ChatMessage, ChatOptions, EmbedOptions } from '../types';

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

    async embed(texts: string[], options?: EmbedOptions): Promise<EmbedResult> {
        const model = options?.model ?? this.defaultEmbeddingModel;

        // OpenAI supports embedding multiple chunks at once.
        const response = await this.client.embeddings.create({
            input: texts,
            model: model,
            dimensions: options?.dimensions ?? this.defaultEmbeddingDimensions,
        });

        // The API returns one item per input; `index` ties each back to texts[index].
        // Sort by index so the pairing is guaranteed, then zip chunk <-> embedding.
        const embeddings = response.data
            .sort((a, b) => a.index - b.index)
            .map((item) => ({
                chunk: texts[item.index],
                embedding: item.embedding,
            }));

        return { embeddings, embeddingModel: model };
    }

    async generateStructured<S extends z.ZodType>(
        messages: ChatMessage[],
        outputSchema: S,
        options?: ChatOptions,
    ): Promise<GenerateResult<z.infer<S>>> {
        const model = options?.model ?? this.defaultChatModel;

        const completion = await this.client.chat.completions.parse({
            model: model,
            temperature: options?.temperature,
            messages: messages,
            response_format: zodResponseFormat(
                outputSchema,
                "structured_output",
            ),
        });

        const parsed = completion.choices[0]?.message.parsed;

        if (parsed == null) {
            throw new Error("Model did not return a parsed structured response.");
        }

        return {
            data: parsed,
            model: completion.model,
            promptTokens: completion.usage?.prompt_tokens ?? 0,
            completionTokens: completion.usage?.completion_tokens ?? 0,
        };
    }
}
