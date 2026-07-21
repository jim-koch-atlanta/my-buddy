import { NewNudge, Nudge } from '../models/nudge';
import { getUserDb } from './user-scoped-db';

export class NudgeProvider {
    private static rowToNudge(row: any): Nudge {
        return {
            id: row.id,
            userId: row.user_id,
            domainId: row.domain_id,
            goalId: row.goal_id,
            title: row.title,
            body: row.body,
            effortMinutes: row.effort_minutes,
            emotionalLoad: row.emotional_load,
            status: row.status,
            createdAt: row.created_at
        }
    }

    private static rowsToNudges(rows: any[]): Nudge[] {
        const nudges: Nudge[] = [];

        for (const row of rows) {
            nudges.push(this.rowToNudge(row));
        }

        return nudges;
    }

    public static async getNudgeByUserId(user_id: string, limit: number | null = null): Promise<Nudge[]> {
        let query = `SELECT id, user_id, domain_id, goal_id, title, body, effort_minutes, emotional_load, status, created_at
                    FROM nudges WHERE user_id=$1 ORDER BY created_at DESC`;

        const params: any[] = [ user_id ];
        if (limit !== null) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await getUserDb(user_id).query(query, params);
        return this.rowsToNudges(rows);
    }

    public static async getNudgeById(user_id: string, nudge_id: string): Promise<Nudge | null> {
        let query = `SELECT id, user_id, domain_id, goal_id, title, body, effort_minutes, emotional_load, status, created_at
                    FROM nudges WHERE id=$1 ORDER BY created_at DESC`;

        const { rows } = await getUserDb(user_id).query(query, [ nudge_id ]);

        if (rows.length != 1) {
            return null;
        }

        return this.rowToNudge(rows[0]);
    }

    public static async create(user_id: string, nudge: NewNudge) : Promise<Nudge> {
        const query = `
            INSERT INTO nudges (
                user_id, domain_id, goal_id,
                title, body, effort_minutes,
                emotional_load
            )
            VALUES($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`;

         const params: any[] =
            [
                user_id, nudge.domainId, nudge.goalId,
                nudge.title, nudge.body, nudge.effortMinutes,
                nudge.emotionalLoad
            ];

        const { rows } = await getUserDb(user_id).query(query, params);

        if (rows.length == 0) {
            throw new Error(`INSERT to nudges table returned no rows.`);
        } else if (rows.length > 1) {
            console.error(`Multiple rows returned on INSERT: ${ JSON.stringify(rows)}`);
        }

        return this.rowToNudge(rows[0]);
    }
}