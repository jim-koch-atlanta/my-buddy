export interface Nudge {
    id: string; // uuid
    userId: string;
    domainId: string;
    goalId: string;
    title: string;
    body: string;
    effortMinutes: number;
    emotionalLoad: string;
    status: string;
    createdAt: Date;
}