export interface NewDailyPlan {
    planDate: Date; // pg parses `date` to a JS Date
    summary: string | null;
}

export interface DailyPlan extends NewDailyPlan {
    id: string; // uuid
    userId: string;
    createdAt: Date;
}
