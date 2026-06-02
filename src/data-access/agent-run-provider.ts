import { AgentRun } from '../models/agent-run';
import { getUserPoolProvider } from './user-pool-provider';

export class AgentRunProvider {
    private static rowToAgentRun(row: any): AgentRun {
        return {
            id: row.id,
            userId: row.user_id,
            agentName: row.agent_name,
            dailyPlanId: row.daily_plan_id,
            inputJson: row.input_json,
            outputJson: row.output_json,
            model: row.model,
            promptTokens: row.prompt_tokens,
            completionTokens: row.completion_tokens,
            costUsd: row.cost_usd,
            createdAt: row.created_at
        }
    }

    private static rowsToAgentRuns(rows: any[]): AgentRun[] {
        const agentRuns: AgentRun[] = [];

        for (const row of rows) {
            agentRuns.push(this.rowToAgentRun(row));
        }

        return agentRuns;
    }

    public static async getByUserId(user_id: string, limit: number | null = null): Promise<AgentRun[]> {
        let query = `SELECT id, user_id, agent_name, daily_plan_id, input_json, output_json,
                            model, prompt_tokens, completion_tokens, cost_usd, created_at
                    FROM agent_runs WHERE user_id=$1 ORDER BY created_at DESC`;

        const params: any[] = [ user_id ];
        if (limit !== null) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await getUserPoolProvider(user_id).query(query, params);
        return this.rowsToAgentRuns(rows);
    }
}
