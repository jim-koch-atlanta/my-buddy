// Test for FriendshipAgent.proposeNudge().
// Run: npx tsx scripts/scratch/propose-friendship-nudge.ts
//
// Exercises the full Step-4 path end-to-end against the real OpenAI API + DB:
//   (1) ingest a few friendship memories THROUGH the pipeline (so they get embedded
//       — SQL-seeded memories are NOT embedded and are invisible to RAG)
//   (2) retrieve friendship memories (embedding search) -> buildContextBlock ->
//       generateStructured -> a NudgeSuggestion.
//
// A grounded suggestion should reference something specific from the memories below
// (e.g. trivia Tuesday), not a generic "reach out to a friend."
//
// Prerequisites:
//   * DB up with a fresh volume (so the smallint emotional_load columns exist):
//       docker compose down -v && docker compose up -d
//   * A working OPENAI_API_KEY in .env.
//
// Note: each run re-ingests the memories as new rows, accumulating duplicates.
// Reset between runs with: docker compose down -v && docker compose up -d

import 'dotenv/config';

import { OpenAiLlmProvider } from '../../src/buddy-ai/openai/OpenAiLlmProvider';
import { OpenAiRagService } from '../../src/buddy-ai/openai/OpenAiRagService';
import { FriendshipAgent } from '../../src/domain-agents/friendship-agent';
import { NewMemory } from '../../src/models/memory';

// Defaults to the seed user from db-schema/9998_user1.sql; override via env.
const USER_ID = process.env.TEST_USER_ID ?? '11111111-2222-3333-4444-555555555555';

const FRIENDSHIP_MEMORIES: string[] = [
    'Jim meets his friends for trivia every Tuesday night at a local pub.',
    'Jim has been meaning to reconnect with his college roommate Dave, who moved to Seattle.',
    'Jim feels most connected during small one-on-one hangouts, and drained by big group parties.',
];

// Build a NewMemory from raw text with sensible defaults for the metadata fields.
function newFriendshipMemory(content: string): NewMemory {
    return {
        memoryType: 'friendship_context',
        domain: 'friendships',
        sourceType: 'manual',
        sourceId: null,
        content,
        importance: 3,
        confidence: 1.0,
        validFrom: new Date(),
        validUntil: null,
    };
}

async function main() {
    const llm = new OpenAiLlmProvider({});
    const rag = new OpenAiRagService({ llmProvider: llm });
    const agent = new FriendshipAgent(llm, rag);

    // (1) Ingest friendship memories through the pipeline so they get embedded.
    console.log('Ingesting friendship memories (embeds them so RAG can find them)...');
    for (const content of FRIENDSHIP_MEMORIES) {
        await rag.ingestMemory(USER_ID, newFriendshipMemory(content));
    }

    // (2) Propose a nudge grounded in those memories.
    console.log(`\nProposing a friendship nudge for user ${USER_ID}...\n`);
    const { suggestion, usage } = await agent.proposeNudge(USER_ID);

    console.log('--- Suggestion ------------------------------------------------');
    console.log(`Title:          ${suggestion.title}`);
    console.log(`Body:           ${suggestion.body}`);
    console.log(`Effort (min):   ${suggestion.effortMinutes}`);
    console.log(`Emotional load: ${suggestion.emotionalLoad}`);
    console.log(`Rationale:      ${suggestion.rationale}`);
    console.log('--- Usage -----------------------------------------------------');
    console.log(`Model:  ${usage.model}`);
    console.log(`Tokens: ${usage.promptTokens} prompt + ${usage.completionTokens} completion`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
