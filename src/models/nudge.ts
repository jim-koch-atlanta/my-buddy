export interface NewNudge {
    domainId: string;
    goalId: string | null;
    title: string;
    body: string;
    effortMinutes: number;
    emotionalLoad: number;
}

export interface Nudge extends NewNudge {
    id: string; // uuid
    userId: string;
    status: string;
    createdAt: Date;
}