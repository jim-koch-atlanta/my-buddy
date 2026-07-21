import { NewDailyPlan, DailyPlan } from '../models/daily-plan';
import { getUserDb } from './user-scoped-db';

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

    // A plan_date is a calendar day, not an instant. Render a Date to a local
    // 'YYYY-MM-DD' string so the day doesn't shift across the DB session timezone.
    private static toPlanDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    public static async getByUserId(user_id: string, limit: number | null = null): Promise<DailyPlan[]> {
        let query = `SELECT id, user_id, plan_date, summary, created_at
                    FROM daily_plans WHERE user_id=$1 ORDER BY plan_date DESC`;

        const params: any[] = [ user_id ];
        if (limit !== null) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await getUserDb(user_id).query(query, params);
        return this.rowsToDailyPlans(rows);
    }

    public static async getById(user_id: string, id: string): Promise<DailyPlan | null> {
        const { rows } = await getUserDb(user_id).query(
            `SELECT id, user_id, plan_date, summary, created_at
            FROM daily_plans WHERE id=$1`, [ id ]
        );

        if (rows.length != 1) {
            return null;
        }

        return this.rowToDailyPlan(rows[0]);
    }

    public static async getByUserIdAndDate(user_id: string, planDate: Date): Promise<DailyPlan | null> {
        const postgresPlanDate = this.toPlanDate(planDate);

        const { rows } = await getUserDb(user_id).query(
            `SELECT id, user_id, plan_date, summary, created_at
            FROM daily_plans WHERE user_id=$1 AND plan_date = $2::date`, [ user_id, postgresPlanDate ]
        );

        if (rows.length !== 1) {
            return null;
        }

        return this.rowToDailyPlan(rows[0]);
    }

    public static async create(user_id: string, dailyPlan: NewDailyPlan) : Promise<DailyPlan> {
        const query = `
            INSERT INTO daily_plans (
                user_id, plan_date, summary
            )
            VALUES($1, $2, $3)
            RETURNING *`;

        const postgresPlanDate = this.toPlanDate(dailyPlan.planDate);

         const params: any[] =
            [
                user_id, postgresPlanDate, dailyPlan.summary
            ];

        const { rows } = await getUserDb(user_id).query(query, params);

        if (rows.length == 0) {
            throw new Error(`INSERT to daily_plans table returned no rows.`);
        } else if (rows.length > 1) {
            console.error(`Multiple rows returned on INSERT: ${ JSON.stringify(rows)}`);
        }

        return this.rowToDailyPlan(rows[0]);
    }
}
