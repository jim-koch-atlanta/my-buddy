export interface DailyPlan {
    id: string; // uuid
    userId: string;
    planDate: Date; // pg parses `date` to a JS Date
    summary: string | null;
    createdAt: Date;
}
