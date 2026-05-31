#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v APPUSER_USER="$APPUSER_USER" -v APPUSER_PASSWORD="$APPUSER_PASSWORD" <<'EOSQL'

-- init.sql
CREATE EXTENSION IF NOT EXISTS vector;

-- The role the APPLICATION connects as. Not a superuser, does not own the tables,
-- and explicitly cannot bypass RLS → policies are actually enforced for it.
CREATE ROLE :"APPUSER_USER" LOGIN PASSWORD :'APPUSER_PASSWORD' NOSUPERUSER NOBYPASSRLS;

-- It needs to use the schema and read/write the tables (but not own or alter them).
GRANT USAGE ON SCHEMA public TO :"APPUSER_USER";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"APPUSER_USER";

-- Give SELECT, INSERT, UPDATE, DELETE to appuser for any future tables.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"APPUSER_USER";
EOSQL