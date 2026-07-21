import { ConsolidatedDailyPlanProvider } from "../data-access/consolidated-daily-plan-provider";
import { DailyPlanItemProvider } from "../data-access/daily-plan-item-provider";
import { DailyPlanProvider } from "../data-access/daily-plan-provider";
import { LifeDomainProvider } from "../data-access/life-domain-provider";
import { NudgeProvider } from "../data-access/nudge-provider";
import { ConsolidatedDailyPlan, DailyPlan } from "../models/daily-plan";
import { DailyPlanItem } from "../models/daily-plan-item";
import { LifeDomain } from "../models/life-domain";
import { Nudge } from "../models/nudge";
import { NudgeCandidate, PlanSelection, selectDailyPlan } from "./balance-governor";
import { getDomainAgent } from "./domain-agent-factory";

export async function runDailyPlan(userId: string, date: Date): Promise<ConsolidatedDailyPlan> {
    // We should only generate one daily plan per-user per-day.
    const existingDailyPlan: ConsolidatedDailyPlan | null = await ConsolidatedDailyPlanProvider.getByUserIdAndDate(userId, date);
    if (existingDailyPlan !== null) {
        return existingDailyPlan;
    }

    const lifeDomains: LifeDomain[] = await LifeDomainProvider.getAll(userId);

    // For each of the user's life domains, create a nudge candidate.
    const nudgeCandidates: NudgeCandidate[] = [];
    for (const lifeDomain of lifeDomains) {
        const agent = getDomainAgent(lifeDomain.name);
        if (agent === null) continue; // No agent for this domain.

        const proposeNudgeResult = await agent.proposeNudge(userId);
        const nudgeCandidate: NudgeCandidate = {
            domainName: lifeDomain.name,
            domainId: lifeDomain.id,
            suggestion: proposeNudgeResult.suggestion,
        };
        nudgeCandidates.push(nudgeCandidate);
    }

    // Produce plan selections from the nudge candidates.
    const planSelections: PlanSelection[] = selectDailyPlan(nudgeCandidates);

    const dailyPlan: DailyPlan = await DailyPlanProvider.create(userId, {
        planDate: date,
        summary: `Daily plan for ${DailyPlanProvider.toPlanDate(date)}`,
    });

    const nudges: Nudge[] = [];
    const dailyPlanItems: DailyPlanItem[] = [];
    for (const planSelection of planSelections) {
        const nudge: Nudge = await NudgeProvider.create(userId, {
            domainId: planSelection.candidate.domainId,
            goalId: null,
            title: planSelection.candidate.suggestion.title,
            body: planSelection.candidate.suggestion.body,
            effortMinutes: planSelection.candidate.suggestion.effortMinutes,
            emotionalLoad: planSelection.candidate.suggestion.emotionalLoad,
        });
        nudges.push(nudge);

        const dailyPlanItem: DailyPlanItem = await DailyPlanItemProvider.create(userId, {
            dailyPlanId: dailyPlan.id,
            nudgeId: nudge.id,
            role: planSelection.role,
            remindAt: null,
        })
        dailyPlanItems.push(dailyPlanItem);
    }

    // TODO.
    // AgentRunProvider.create(userId, {
    //     agentName: '',
    //     dailyPlanId: '',
    //     inputJson: '',
    //     outputJson: '',
    //     model: '',
    //     promptTokens: 0,
    //     completionTokens: 0,
    //     costUsd: '',
    // });

    return {
        dailyPlan: dailyPlan,
        nudges: nudges,
        dailyPlanItems: dailyPlanItems
    };
}