export interface DailyPlanItem {
    id: string; // uuid
    userId: string;
    dailyPlanId: string;
    nudgeId: string;
    role: string; // primary|secondary|optional
    remindAt: Date | null;
    status: string; // pending|sent|done|skipped|snoozed
}
