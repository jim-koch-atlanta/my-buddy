import { NewDailyPlan, DailyPlan, ConsolidatedDailyPlan } from '../models/daily-plan';
import { DailyPlanItem } from '../models/daily-plan-item';
import { Nudge } from '../models/nudge';
import { DailyPlanItemProvider } from './daily-plan-item-provider';
import { DailyPlanProvider } from './daily-plan-provider';
import { NudgeProvider } from './nudge-provider';

export class ConsolidatedDailyPlanProvider {
    public static async getByUserIdAndDate(user_id: string, planDate: Date): Promise<ConsolidatedDailyPlan | null> {
        const dailyPlan: DailyPlan | null = await DailyPlanProvider.getByUserIdAndDate(user_id, planDate);
        if (dailyPlan === null) {
            return null;
        }

        const dailyPlanItems: DailyPlanItem[] = await DailyPlanItemProvider.getByDailyPlanId(user_id, dailyPlan.id);

        const nudges: Nudge[] = [];
        for (const dailyPlanItem of dailyPlanItems) {
            const nudge = await NudgeProvider.getNudgeById(user_id, dailyPlanItem.nudgeId);
            if (nudge !== null) {
                nudges.push(nudge);
            }
        }

        return {
            dailyPlan: dailyPlan,
            nudges: nudges,
            dailyPlanItems: dailyPlanItems,
        }
    }
}
