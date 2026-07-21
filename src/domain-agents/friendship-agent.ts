import { z } from "zod/v4";

import { Memory } from "../models/memory";
import { RagService } from "../buddy-ai/RagService";
import { LlmProvider } from "../buddy-ai/LlmProvider";
import { ChatMessage } from "../buddy-ai/types";
import { NudgeSuggestion, NudgeSuggestionData } from "../buddy-ai/structured-output";
import { GenerateResult } from "../buddy-ai/LlmProvider";

import { MemoryFilters } from "../data-access/memory-filters/memory-filters";
import { DomainMemoryFilter } from "../data-access/memory-filters/domain-memory-filter";

export class FriendshipAgent {
    ragService: RagService;
    llmProvider: LlmProvider;

    retrievalQuery: string = `Signals about this person's friendships: who they care about, how they like to connect,
    recent social wins or gaps, and what kind of outreach feels easy or hard for them.`;

    constructor(llmProvider: LlmProvider, ragService: RagService) {
        this.llmProvider = llmProvider;
        this.ragService = ragService;
    }

    async retrieveMemories(userId: string): Promise<Memory[]> {
        const filters: MemoryFilters = [new DomainMemoryFilter('friendships')];
        const memories: Memory[] = await this.ragService.retrieveMemories(userId, this.retrievalQuery, filters, 5);        
        return memories;
    }

    groundMemories(memories: Memory[]): string {
        const contextBlock: string = this.ragService.buildContextBlock(memories);
        return contextBlock;
    }

    generateNudge(contextBlock: string): Promise<GenerateResult<NudgeSuggestionData>> {
        const systemMessage: ChatMessage = {
            role: "system",
            content: `You are a helpful AI assistant that generates "nudges" to
                help individuals achieve their life goals. Nudges should be generated
                based on the past results for this individual. All nudges should
                ensure the emotional well-being of the individual.
                
                * Suggest **one small** action.
                * Ground it in the provided memories. Invent nothing.
                * If there are no memories, offer a general starter.
                * Respect requirements about effort.
                * Never make suggestions that would exceed the maximum emotional load that was specified. An emotional load of 1 means that the task should have no emotional load, and an emotional load value of 5 means that the task can have extremely heigh emotional load.`,
        };

        const userMessage: ChatMessage = {
            role: "user",
            content: `${contextBlock}\n\nBased on the memories above, suggest today's one friendship nudge.`,
        }
        return this.llmProvider.generateStructured([ systemMessage, userMessage ], NudgeSuggestion);
    }

    async proposeNudge(userId: string) {
        const memories = await this.retrieveMemories(userId);
        const contextBlock = await this.groundMemories(memories);
        const result = await this.generateNudge(contextBlock);

        return {
            suggestion: result.data,
            usage: {
                model: result.model,
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
            }
        }
    }
}