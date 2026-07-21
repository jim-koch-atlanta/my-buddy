import { NewAgentRun, AgentRun } from '../models/agent-run';
import { getUserDb } from './user-scoped-db';

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

        const { rows } = await getUserDb(user_id).query(query, params);
        return this.rowsToAgentRuns(rows);
    }

    public static async create(user_id: string, agentRun: NewAgentRun) : Promise<AgentRun> {
        const inputJson  = agentRun.inputJson  == null ? null : JSON.stringify(agentRun.inputJson);
        const outputJson = agentRun.outputJson == null ? null : JSON.stringify(agentRun.outputJson);

        const query = `
            INSERT INTO agent_runs (
                user_id, agent_name, daily_plan_id, input_json, output_json,
                model, prompt_tokens, completion_tokens, cost_usd
            )
            VALUES($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9)
            RETURNING *`;

         const params: any[] =
            [
                user_id, agentRun.agentName, agentRun.dailyPlanId, inputJson, outputJson,
                agentRun.model, agentRun.promptTokens, agentRun.completionTokens, agentRun.costUsd
            ];

        const { rows } = await getUserDb(user_id).query(query, params);

        if (rows.length == 0) {
            throw new Error(`INSERT to agent_runs table returned no rows.`);
        } else if (rows.length > 1) {
            console.error(`Multiple rows returned on INSERT: ${ JSON.stringify(rows)}`);
        }

        return this.rowToAgentRun(rows[0]);
    }
}
