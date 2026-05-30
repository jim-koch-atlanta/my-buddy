CREATE TABLE memories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_type  text NOT NULL,   -- preference|goal|behavior|nudge_feedback|
                                 -- friendship_context|sleep_feedback|...
  domain       text,             -- optional life-domain tag for filtering
  source_type  text,             -- 'nudge_feedback','journal','manual','agent_observation'
  source_id    uuid,             -- optional pointer back into app tables
  content      text NOT NULL,    -- natural-language memory (what gets embedded)

  importance   smallint NOT NULL DEFAULT 3,  -- 1..5, used in retrieval scoring
  confidence   real     NOT NULL DEFAULT 1.0, -- 0..1

  valid_from    timestamptz NOT NULL DEFAULT now(),
  valid_until   timestamptz,                  -- NULL = still valid
  superseded_by uuid REFERENCES memories(id), -- the memory that replaced this

  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memory_embeddings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,    -- denormalized for RLS + per-tenant vector search
  memory_id       uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  chunk_index     int  NOT NULL DEFAULT 0,        -- 0-based position within the memory's content
  chunk_text      text NOT NULL,                  -- the exact text that was embedded
  embedding       vector(1536),                   -- text-embedding-3-small dimension
  embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (memory_id, chunk_index, embedding_model)
);
-- memory_embeddings is tenant-owned too: ENABLE/FORCE RLS with the same user_id policy.

-- Metadata filter index on the parent memory (tenant + type + validity).
CREATE INDEX memories_filter ON memories (user_id, memory_type, valid_until);
-- Fetch a memory's chunks; the user_id index keeps vector search tenant-scoped.
CREATE INDEX memory_embeddings_by_memory ON memory_embeddings (memory_id);
CREATE INDEX memory_embeddings_by_user   ON memory_embeddings (user_id);
