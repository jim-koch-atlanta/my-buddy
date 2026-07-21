export interface NewNudgeFeedback {
    nudgeId: string;
    feedbackType: string; // done|skipped|snoozed|too_hard|not_relevant|helpful|annoying|more_like_this|less_like_this
    notes: string | null;
}

export interface NudgeFeedback extends NewNudgeFeedback {
    id: string; // uuid
    userId: string;
    createdAt: Date;
}
