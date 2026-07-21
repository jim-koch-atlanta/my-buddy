import { NudgeSuggestionData } from "../buddy-ai/structured-output";

export interface NudgeCandidate {
    domain: string;
    suggestion: NudgeSuggestionData;
}

export interface PlanSelection {
    candidate: NudgeCandidate;
    role: 'primary' | 'secondary' | 'optional';
}

export function selectDailyPlan(candidates: NudgeCandidate[]): PlanSelection[] {
    // For the initial proof-of-concept, we'll just make the first one primary,
    // and the other ones secondary.
    return candidates.map((candidate, i) => ({
        candidate,
        role: i === 0 ? 'primary' : 'secondary',
    }))
}