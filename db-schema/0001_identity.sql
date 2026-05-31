CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text UNIQUE NOT NULL,
  name           text NOT NULL,
  timezone       text NOT NULL DEFAULT 'America/New_York',
  cognito_sub    text UNIQUE NOT NULL,         -- when using Cognito, stub value locally
  email_verified boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'active', -- active|suspended|deleted
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE  ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING       (id = current_setting('app.current_user_id')::uuid)
  WITH CHECK  (id = current_setting('app.current_user_id')::uuid);
