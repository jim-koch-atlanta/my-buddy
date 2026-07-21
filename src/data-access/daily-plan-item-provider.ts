import { NewDailyPlanItem, DailyPlanItem } from '../models/daily-plan-item';
import { getUserDb } from './user-scoped-db';

export class DailyPlanItemProvider {
    private static rowToDailyPlanItem(row: any): DailyPlanItem {
        return {
            id: row.id,
            userId: row.user_id,
            dailyPlanId: row.daily_plan_id,
            nudgeId: row.nudge_id,
            role: row.role,
            remindAt: row.remind_at,
            status: row.status
        }
    }

    private static rowsToDailyPlanItems(rows: any[]): DailyPlanItem[] {
        const dailyPlanItems: DailyPlanItem[] = [];

        for (const row of rows) {
            dailyPlanItems.push(this.rowToDailyPlanItem(row));
        }

        return dailyPlanItems;
    }

    public static async getByDailyPlanId(user_id: string, daily_plan_id: string): Promise<DailyPlanItem[]> {
        const { rows } = await getUserDb(user_id).query(
            `SELECT id, user_id, daily_plan_id, nudge_id, role, remind_at, status
            FROM daily_plan_items WHERE daily_plan_id=$1`, [ daily_plan_id ]
        );

        return this.rowsToDailyPlanItems(rows);
    }

    public static async create(user_id: string, dailyPlanItem: NewDailyPlanItem) : Promise<DailyPlanItem> {
        const query = `
            INSERT INTO daily_plan_items (
                user_id, daily_plan_id, nudge_id, role, remind_at
            )
            VALUES($1, $2, $3, $4, $5)
            RETURNING *`;

         const params: any[] =
            [
                user_id, dailyPlanItem.dailyPlanId, dailyPlanItem.nudgeId, dailyPlanItem.role, dailyPlanItem.remindAt
            ];

        const { rows } = await getUserDb(user_id).query(query, params);

        if (rows.length == 0) {
            throw new Error(`INSERT to daily_plan_items table returned no rows.`);
        } else if (rows.length > 1) {
            console.error(`Multiple rows returned on INSERT: ${ JSON.stringify(rows)}`);
        }

        return this.rowToDailyPlanItem(rows[0]);
    }
}
