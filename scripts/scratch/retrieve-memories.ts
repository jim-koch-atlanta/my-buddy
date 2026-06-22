// Test for MemoryEmbeddingProvider.getRelatedMemories().
// Run: npx tsx scripts/scratch/retrieve-memories.ts
//      npx tsx scripts/scratch/retrieve-memories.ts "a custom query"
//
// (1) ingests test memories
// (2) embeds a query
// (3) prints the related memories ranked by similarity
//
// Note: Each run re-ingests the test memories as new rows, so running
// it repeatedly accumulates duplicates. Reset between runs with:
//   docker compose down -v && docker compose up -d

import { OpenAiLlmProvider } from '../../src/buddy-ai/openai/OpenAiLlmProvider';
import { OpenAiRagService } from '../../src/buddy-ai/openai/OpenAiRagService';
import { MemoryEmbeddingProvider } from '../../src/data-access/memory-embedding-provider';
import { NewMemory } from '../../src/models/memory';

// Defaults to the seed user from db-schema/9998_user1.sql; override via env.
const USER_ID = process.env.TEST_USER_ID ?? '11111111-2222-3333-4444-555555555555';

const TEST_MEMORIES: string[] = [
    'Jim played tennis from when he was a little kid until 11th grade.',
    'Jim has played pickleball once and enjoyed it a lot.',
    'Jim has played ping-pong many times, and he does not like it at all.',
    'Jim\'s relatives used to play ping-pong at Thanksgiving, and Jim would lose.',
    'Jim has read the Andre Agassi book "Open" and enjoyed it.',
    'Jim is in a book club.',
];

// Build a NewMemory from raw text with sensible defaults for the metadata fields.
function newMemory(content: string): NewMemory {
    return {
        memoryType: 'behavior',
        domain: 'hobbies',
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

    // (1) Ingest the test memories.
    console.log('Ingesting test memories...');
    for (const content of TEST_MEMORIES) {
        await rag.ingestMemory(USER_ID, newMemory(content));
    }

    // (2) Embed a query.
    const query = process.argv[2] ?? 'What paddle sports does Jim enjoy?';
    console.log(`\nQuery: "${query}"\n`);

    const embedded = await llm.embed([query]);
    const queryVector = embedded.embeddings[0].embedding;

    // (3) Retrieve related memories.
    const results = await MemoryEmbeddingProvider.getRelatedMemories(
        USER_ID,
        queryVector,
        [],      // no filters
        10,      // limit
    );

    // Print each result's similarity + text, best first.
    console.log('Results (best first):');
    for (const r of results) {
        console.log(`  [${r.similarity.toFixed(4)}]  ${r.chunkText}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
