import { NudgeSuggestionData } from "../buddy-ai/structured-output";

// Basic reshape to have "suggestion" instead of "data".
export interface ProposeNudgeResult {
    suggestion: NudgeSuggestionData;
    usage: {
        model: string,
        promptTokens: number,
        completionTokens: number,
    };
}

export interface AgentInterface {
   proposeNudge(userId: string): Promise<ProposeNudgeResult>;
}