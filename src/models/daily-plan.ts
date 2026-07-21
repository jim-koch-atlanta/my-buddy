import { DailyPlanItem } from "./daily-plan-item";
import { Nudge } from "./nudge";

export interface NewDailyPlan {
    planDate: Date; // pg parses `date` to a JS Date
    summary: string | null;
}

export interface DailyPlan extends NewDailyPlan {
    id: string; // uuid
    userId: string;
    createdAt: Date;
}

export interface ConsolidatedDailyPlan {
    dailyPlan: DailyPlan;
    nudges: Nudge[];
    dailyPlanItems: DailyPlanItem[];
}