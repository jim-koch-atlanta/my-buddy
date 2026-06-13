## Step 3: Produce the basic scaffolding of the Node/TS + Express project.

1. Run the following commands:
```
npm init -y
npm install typescript
npm install express pg dotenv
npm install -D typescript @types/node @types/express @types/pg ts-node-dev
```
2. Add [tsconfig.json](../tsconfig.json).
3. Add [db.ts](../src/db.ts).
4. Add [index.ts](../src/index.ts).
5. Add `dev`, `build,` and `start` tasks to [package.json](../package.json).
5. Start the Postgres DB container with `docker compose down -v && docker compose up --build`.
6. Run `npm run dev`.
7. In a browser, verify access to [http://localhost:3000/api/db-status](http://localhost:3000/api/db-status).

## Step 4: Add local seed data for two test users for testing.

See [9998_user1.sql](../db-schema/9998_user1.sql) and [9999_user2.sql](../db-schema/9999_user2.sql). Honestly, I used Claude for this part. It did pretty good.

## Step 5: Build the data-access layer

I split the actually DB access from the object definitions. For example, see [user-provider.ts](../src/data-access/user-provider.ts) vs. [user.ts](../src/models/user.ts).

While doing this work, I also updated to support row-level security (RLS) with tenant-context. The big thing that I fumbled was actually setting `app.current_user_id`. From `psql`, you would just:

```
SET LOCAL app.current_user_id="1234-5678-90ab-..."
```
so I tried doing that in [user-pool-provider.ts](../src/data-access/user-pool-provider.ts), and it was giving me an error about passing 1 parameter for a query with no parameterized values. I finally sorted out switching to `SELECT set_config()`.

## Testing Note
**Note**: For testing, first start up the Postgres container:
```
docker composer down -v && docker compose up --build
```

Then I can run `npx tsx` and have a REPL:
```
const m = await import('./src/data-access/user-pool-provider.ts')
const userPool = m.default.getUserPoolProvider('11111111-2222-3333-4444-555555555555')
await userPool.query('SELECT * FROM nudges WHERE user_id=$1', ['11111111-2222-3333-4444-555555555555'])
```

Neat.

## Memory data model

We'll need the `Memory` data model and `MemoryProvider` for testing `LlmProvider` and `RagService`. Validating that `MemoryProvider` is written correctly:

```
const m = await import('./src/data-access/memory-provider.ts')
await m.default.MemoryProvider.getByUserId('11111111-2222-3333-4444-555555555555');
await m.default.MemoryProvider.getById('11111111-2222-3333-4444-555555555555', '7eb7bb8b-51b9-4c4b-ad8a-d155301c019a');
```

## RAG support

The next steps are:
1. `LlmProvider.embed()`: (text → vectors)
2. `RagService.ingestMemory()`: chunk, embed, store. Will use `LlmProvider.embed()`.
3. `RagService.retrieveMemories()` — embed the query, cosine search for the retrieval.

### `LlmProvider.embed()`

First I had to `npm install openai`. Writing the code was pretty easy... see [OpenAiLlmProviderts.](../src/buddy-ai/openai/OpenAiLlmProvider.ts). Verified the `embed()` function:
```
const m = await import('./src/buddy-ai/openai/OpenAiLlmProvider.ts')
provider = new m.default.OpenAiLlmProvider();
await provider.embed(['Jim is testing embeddings.']);
```

### `RagService.embedMemory()`

As a short-term step, I wrote the code to perfrom embedding on an unembedded (`string`) memory. The steps are:

1. Perform chunking. This breaks on paragraphs, and then if necessary it'll do a rolling window.
2. Call `LlmProvider.embed()` to convert from chunk text to `number[]`.
3. Store the embeddings (`number[][]`) to the `memory_embeddings` table.

Verified with the following code:
```
const OpenAiLlmProvider = await import('./src/buddy-ai/openai/OpenAiLlmProvider.ts')
const OpenAiRagService = await import('./src/buddy-ai/openai/OpenAiRagService.ts')
const MemoryProvider = await import('./src/data-access/memory-provider.ts')

const userId = '11111111-2222-3333-4444-555555555555'  // Jim
const svc = new OpenAiRagService.default.OpenAiRagService({ llmProvider: new OpenAiLlmProvider.default.OpenAiLlmProvider({}) })

const memories = await MemoryProvider.default.MemoryProvider.getByUserId(userId)   // his 6 seeded memories
const m = memories[0]
await svc.embedMemory(userId, m.id, { userId, content: m.content })

const MemoryEmbeddingProvider = await import('./src/data-access/memory-embedding-provider.ts')
const rows = await MemoryEmbeddingProvider.default.MemoryEmbeddingProvider.getByUserId(userId)
rows.length
rows[0].embedding.length
```

This should only be called by `RagService.ingestMemory()`, so I'll work on that next.

### `RagService.ingestMemory()`
