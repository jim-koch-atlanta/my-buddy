// Per-user configuration of a life domain (association entity).
// Composite primary key (userId, lifeDomainId) — no surrogate id.
export interface UserLifeDomain {
    userId: string;
    lifeDomainId: string;
    priority: number;
    desiredCadenceDays: number;
    maxNudgesPerWeek: number;
    emotionalLoadTolerance: number;
    allowedReminderStart: string | null; // pg returns `time` as a string e.g. '09:00:00'
    allowedReminderEnd: string | null;
    enabled: boolean;
    createdAt: Date;
}
