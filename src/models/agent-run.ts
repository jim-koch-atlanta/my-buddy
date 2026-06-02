export interface AgentRun {
    id: string; // uuid
    userId: string;
    agentName: string; // 'dating','friendship','balance_governor'...
    dailyPlanId: string | null;
    inputJson: any | null; // jsonb — retrieved memory ids, filters, query
    outputJson: any | null; // jsonb — suggestion / decision
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    costUsd: string | null; // pg returns NUMERIC as a string to preserve precision
    createdAt: Date;
}
