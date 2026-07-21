export interface NewDailyPlanItem {
    dailyPlanId: string;
    nudgeId: string;
    role: string; // primary|secondary|optional
    remindAt: Date | null;
}

export interface DailyPlanItem extends NewDailyPlanItem {
    id: string; // uuid
    userId: string;
    status: string; // pending|sent|done|skipped|snoozed
}
