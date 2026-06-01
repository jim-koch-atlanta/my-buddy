-- Shared catalog of available domains. NOT tenant-scoped: no user_id, no RLS.
CREATE TABLE life_domains (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text UNIQUE NOT NULL,    -- 'friendships','dating','sleep',...
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO life_domains (name) VALUES ('friendships');
INSERT INTO life_domains (name) VALUES ('dating');
INSERT INTO life_domains (name) VALUES ('fitness');
INSERT INTO life_domains (name) VALUES ('sleep');
INSERT INTO life_domains (name) VALUES ('learning');
INSERT INTO life_domains (name) VALUES ('job search');
INSERT INTO life_domains (name) VALUES ('hobbies');

-- Per-user configuration of a domain. An association entity: a join table that carries
-- its own columns. Tenant-owned → ENABLE/FORCE RLS like the other user tables.
CREATE TABLE user_life_domains (
  user_id                  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  life_domain_id           uuid NOT NULL REFERENCES life_domains(id) ON DELETE CASCADE,
  priority                 int  NOT NULL DEFAULT 3, -- 1=high .. 5=low
  desired_cadence_days     int  NOT NULL DEFAULT 7,
  max_nudges_per_week      int  NOT NULL DEFAULT 3,
  emotional_load_tolerance text NOT NULL DEFAULT 'medium', -- low|medium|high
  allowed_reminder_start   time,
  allowed_reminder_end     time,
  enabled                  boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, life_domain_id)
);

ALTER TABLE user_life_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_life_domains FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON user_life_domains
  USING       (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK  (user_id = current_setting('app.current_user_id')::uuid);

CREATE TABLE goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- denormalized for RLS + scoping
  domain_id   uuid NOT NULL REFERENCES life_domains(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'active', -- active|paused|done|dropped
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON goals
  USING       (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK  (user_id = current_setting('app.current_user_id')::uuid);

CREATE TABLE nudges (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_id      uuid NOT NULL REFERENCES life_domains(id) ON DELETE CASCADE,
  goal_id        uuid REFERENCES goals(id) ON DELETE SET NULL,
  title          text NOT NULL,
  body           text NOT NULL,
  effort_minutes int,
  emotional_load text NOT NULL DEFAULT 'low',
  status         text NOT NULL DEFAULT 'proposed', -- proposed|scheduled|done|skipped|snoozed
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON nudges
  USING       (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK  (user_id = current_setting('app.current_user_id')::uuid);

CREATE TABLE daily_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date   date NOT NULL,
  summary     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);

ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON daily_plans
  USING       (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK  (user_id = current_setting('app.current_user_id')::uuid);

CREATE TABLE daily_plan_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_plan_id uuid NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  nudge_id      uuid NOT NULL REFERENCES nudges(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'primary', -- primary|secondary|optional
  remind_at     timestamptz,
  status        text NOT NULL DEFAULT 'pending'  -- pending|sent|done|skipped|snoozed
);

ALTER TABLE daily_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plan_items FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON daily_plan_items
  USING       (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK  (user_id = current_setting('app.current_user_id')::uuid);

CREATE TABLE nudge_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nudge_id      uuid NOT NULL REFERENCES nudges(id) ON DELETE CASCADE,
  feedback_type text NOT NULL,   -- done|skipped|snoozed|too_hard|not_relevant|
                                 -- helpful|annoying|more_like_this|less_like_this
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nudge_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_feedback FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON nudge_feedback
  USING       (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK  (user_id = current_setting('app.current_user_id')::uuid);

-- Audit trail + per-tenant cost metering.
CREATE TABLE agent_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name    text NOT NULL,          -- 'dating','friendship','balance_governor'...
  daily_plan_id uuid REFERENCES daily_plans(id) ON DELETE SET NULL,
  input_json    jsonb,                  -- retrieved memory ids, filters, query
  output_json   jsonb,                  -- suggestion / decision
  model         text,
  prompt_tokens int,
  completion_tokens int,
  cost_usd      numeric(10,5),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON agent_runs
  USING       (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK  (user_id = current_setting('app.current_user_id')::uuid);
