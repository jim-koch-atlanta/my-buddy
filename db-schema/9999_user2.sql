-- Seed data for test user 2: Paul. A completely separate tenant from Jim — they share
-- NO data, which is exactly what makes the RLS isolation test meaningful (build step 5).
-- Same notes as 9998: runs as superuser during initdb; embeddings seeded later.
-- Domain names below must match the life_domains catalog in 0002_app_state.sql.

INSERT INTO users (email, name, timezone, cognito_sub, email_verified, status)
VALUES ('paul@example.com', 'Paul', 'America/Los_Angeles', 'paul@example.com', true, 'active');

-- Paul enables a different set of domains than Jim.
INSERT INTO user_life_domains
  (user_id, life_domain_id, priority, desired_cadence_days, max_nudges_per_week, emotional_load_tolerance)
SELECT u.id, d.id, v.priority, v.cadence_days, v.max_per_week, v.tolerance
FROM users u
JOIN (VALUES
  ('job search', 1, 3, 3, 'medium'),
  ('sleep',      2, 1, 5, 'medium'),
  ('hobbies',    2, 7, 2, 'low')
) AS v(domain_name, priority, cadence_days, max_per_week, tolerance) ON TRUE
JOIN life_domains d ON d.name = v.domain_name
WHERE u.email = 'paul@example.com';

-- A job-search goal.
INSERT INTO goals (user_id, domain_id, title, description, status)
SELECT u.id, d.id,
       'Apply to five new roles this month',
       'Make steady progress on the job search without burning out.',
       'active'
FROM users u, life_domains d
WHERE u.email = 'paul@example.com' AND d.name = 'job search';

-- A nudge tied to that goal.
INSERT INTO nudges (user_id, domain_id, goal_id, title, body, effort_minutes, emotional_load, status)
SELECT u.id, d.id, g.id,
       'Tailor resume for one role',
       'Pick one job posting and tailor your resume bullet points to it.',
       30, 'medium', 'proposed'
FROM users u
JOIN life_domains d ON d.name = 'job search'
JOIN goals g ON g.user_id = u.id AND g.title = 'Apply to five new roles this month'
WHERE u.email = 'paul@example.com';

-- Paul's curated memories — distinct content from Jim's.
INSERT INTO memories (user_id, memory_type, domain, source_type, content, importance)
SELECT u.id, v.memory_type, v.domain, v.source_type, v.content, v.importance
FROM users u
JOIN (VALUES
  ('preference',     'general',     'manual',
     'Paul prefers morning reminders and dislikes notifications after 8 PM.', 4),
  ('goal',           'job search',  'manual',
     'Paul is job searching and wants to apply to several roles each week.', 4),
  ('behavior',       'general',     'agent_observation',
     'Paul responds well to streak-based encouragement and visible progress.', 4),
  ('sleep_feedback', 'sleep',       'nudge_feedback',
     'Paul has trouble winding down and often stays up past midnight.', 3)
) AS v(memory_type, domain, source_type, content, importance) ON TRUE
WHERE u.email = 'paul@example.com';
