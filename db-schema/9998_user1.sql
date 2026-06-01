-- Seed data for test user 1: Jim.
-- Runs during initdb as the superuser (mybuddy), which bypasses RLS — required here,
-- since we insert rows for a specific tenant before any app.current_user_id is set.
-- NOTE: embeddings are NOT seeded; memory_embeddings is populated later (build step 6),
-- when the LlmProvider generates vectors from the memory text below.

INSERT INTO users (id, email, name, timezone, cognito_sub, email_verified, status)
VALUES ('11111111-2222-3333-4444-555555555555', 'jim@example.com', 'Jim', 'America/New_York', 'jim@example.com', true, 'active');

-- Per-user domain configuration. We join a VALUES list to the shared life_domains
-- catalog (looked up by name) so several domains are configured in one statement.
-- u has exactly one row (Jim), cross-joined (ON TRUE) with each VALUES row.
INSERT INTO user_life_domains
  (user_id, life_domain_id, priority, desired_cadence_days, max_nudges_per_week, emotional_load_tolerance)
SELECT u.id, d.id, v.priority, v.cadence_days, v.max_per_week, v.tolerance
FROM users u
JOIN (VALUES
  ('fitness',      2,  2, 4, 'high'),
  ('learning',     2,  5, 2, 'medium'),
  ('friendships',  2,  7, 2, 'medium'),
  ('sleep',        3,  1, 5, 'low'),
  ('dating',       4, 14, 1, 'low')
) AS v(domain_name, priority, cadence_days, max_per_week, tolerance) ON TRUE
JOIN life_domains d ON d.name = v.domain_name
WHERE u.email = 'jim@example.com';

-- A goal in the learning domain (look up both the user and the domain by natural key).
INSERT INTO goals (user_id, domain_id, title, description, status)
SELECT u.id, d.id,
       'Learn AWS deployment patterns',
       'Get comfortable deploying with ECS Fargate, RDS, and infrastructure-as-code.',
       'active'
FROM users u, life_domains d
WHERE u.email = 'jim@example.com' AND d.name = 'learning';

-- A nudge tied to that goal.
INSERT INTO nudges (user_id, domain_id, goal_id, title, body, effort_minutes, emotional_load, status)
SELECT u.id, d.id, g.id,
       'Read about ECS Fargate',
       'Spend 15 minutes reading the ECS Fargate networking docs.',
       15, 'low', 'proposed'
FROM users u
JOIN life_domains d ON d.name = 'learning'
JOIN goals g ON g.user_id = u.id AND g.title = 'Learn AWS deployment patterns'
WHERE u.email = 'jim@example.com';

-- Curated natural-language memories (the text that will later be embedded for RAG).
INSERT INTO memories (user_id, memory_type, domain, source_type, content, importance)
SELECT u.id, v.memory_type, v.domain, v.source_type, v.content, v.importance
FROM users u
JOIN (VALUES
  ('preference',         'general',     'manual',
     'Jim prefers low-pressure, specific reminders over broad motivational messages.', 4),
  ('goal',               'learning',    'manual',
     'Jim wants to learn more AWS deployment patterns, especially ECS, Fargate, and RDS.', 4),
  ('behavior',           'fitness',     'agent_observation',
     'Jim follows his Garmin running guidance very reliably when the instruction is concrete.', 5),
  ('friendship_context', 'friendships', 'manual',
     'Jim meets with his friends for trivia every Tuesday.', 3),
  ('nudge_feedback',     'dating',      'nudge_feedback',
     'Jim skipped a dating nudge today.', 3),
  ('nudge_feedback',     'dating',      'nudge_feedback',
     'Jim marked a dating nudge as emotionally too heavy.', 3)
) AS v(memory_type, domain, source_type, content, importance) ON TRUE
WHERE u.email = 'jim@example.com';
