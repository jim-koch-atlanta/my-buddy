export interface Goal {
    id: string; // uuid
    userId: string;
    domainId: string;
    title: string;
    description: string | null;
    status: string; // active|paused|done|dropped
    createdAt: Date;
}
