import { DailyPlanItem } from '../models/daily-plan-item';
import { getUserPoolProvider } from './user-pool-provider';

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
        const { rows } = await getUserPoolProvider(user_id).query(
            `SELECT id, user_id, daily_plan_id, nudge_id, role, remind_at, status
            FROM daily_plan_items WHERE daily_plan_id=$1`, [ daily_plan_id ]
        );

        return this.rowsToDailyPlanItems(rows);
    }
}
