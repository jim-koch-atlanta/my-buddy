import { OpenAiLlmProvider } from "../buddy-ai/openai/OpenAiLlmProvider";
import { OpenAiRagService } from "../buddy-ai/openai/OpenAiRagService";
import { AgentInterface } from "./agent-interface";
import { FriendshipAgent } from "./friendship-agent";

export function getDomainAgent(agentName: string): AgentInterface | null {
    const llm = new OpenAiLlmProvider({});
    const rag = new OpenAiRagService({ llmProvider: llm });
    
    switch (agentName) {
        case 'friendships':
            return new FriendshipAgent(llm, rag);
        default:
            return null;
    }
}