import { Goal } from '../models/goal';
import { getUserPoolProvider } from './user-pool-provider';

export class GoalProvider {
    private static rowToGoal(row: any): Goal {
        return {
            id: row.id,
            userId: row.user_id,
            domainId: row.domain_id,
            title: row.title,
            description: row.description,
            status: row.status,
            createdAt: row.created_at
        }
    }

    private static rowsToGoals(rows: any[]): Goal[] {
        const goals: Goal[] = [];

        for (const row of rows) {
            goals.push(this.rowToGoal(row));
        }

        return goals;
    }

    public static async getByUserId(user_id: string, limit: number | null = null): Promise<Goal[]> {
        let query = `SELECT id, user_id, domain_id, title, description, status, created_at
                    FROM goals WHERE user_id=$1 ORDER BY created_at DESC`;

        const params: any[] = [ user_id ];
        if (limit !== null) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await getUserPoolProvider(user_id).query(query, params);
        return this.rowsToGoals(rows);
    }

    public static async getById(user_id: string, id: string): Promise<Goal | null> {
        const { rows } = await getUserPoolProvider(user_id).query(
            `SELECT id, user_id, domain_id, title, description, status, created_at
            FROM goals WHERE id=$1`, [ id ]
        );

        if (rows.length != 1) {
            return null;
        }

        return this.rowToGoal(rows[0]);
    }
}
