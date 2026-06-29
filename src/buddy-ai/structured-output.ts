import { z } from 'zod/v4';

export const NudgeSuggestion = z.object({
  title: z.string().describe("The title of the nudge suggestion."),
  date: z.string().describe("The date of the nudge suggestion."),
  effortMinutes: z
    .number()
    .int()
    .min(1)
    .describe("The expected number of minutes of effort to complete the nudge."),
  emotionalLoad: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("The expected emotional load from completing this nudge."),
  rationale: z.string().describe("The rationale for suggesting this nudge."),
});