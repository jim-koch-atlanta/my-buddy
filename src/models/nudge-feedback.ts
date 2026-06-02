export interface NudgeFeedback {
    id: string; // uuid
    userId: string;
    nudgeId: string;
    feedbackType: string; // done|skipped|snoozed|too_hard|not_relevant|helpful|annoying|more_like_this|less_like_this
    notes: string | null;
    createdAt: Date;
}
