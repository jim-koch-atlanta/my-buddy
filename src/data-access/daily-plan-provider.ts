import { DailyPlan } from '../models/daily-plan';
import { getUserPoolProvider } from './user-pool-provider';

export class DailyPlanProvider {
    private static rowToDailyPlan(row: any): DailyPlan {
        return {
            id: row.id,
            userId: row.user_id,
            planDate: row.plan_date,
            summary: row.summary,
            createdAt: row.created_at
        }
    }

    private static rowsToDailyPlans(rows: any[]): DailyPlan[] {
        const dailyPlans: DailyPlan[] = [];

        for (const row of rows) {
            dailyPlans.push(this.rowToDailyPlan(row));
        }

        return dailyPlans;
    }

    public static async getByUserId(user_id: string, limit: number | null = null): Promise<DailyPlan[]> {
        let query = `SELECT id, user_id, plan_date, summary, created_at
                    FROM daily_plans WHERE user_id=$1 ORDER BY plan_date DESC`;

        const params: any[] = [ user_id ];
        if (limit !== null) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await getUserPoolProvider(user_id).query(query, params);
        return this.rowsToDailyPlans(rows);
    }

    public static async getById(user_id: string, id: string): Promise<DailyPlan | null> {
        const { rows } = await getUserPoolProvider(user_id).query(
            `SELECT id, user_id, plan_date, summary, created_at
            FROM daily_plans WHERE id=$1`, [ id ]
        );

        if (rows.length != 1) {
            return null;
        }

        return this.rowToDailyPlan(rows[0]);
    }
}
