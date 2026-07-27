CREATE SCHEMA IF NOT EXISTS intellidine;
SET search_path TO intellidine;

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at int,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" text UNIQUE NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamptz NOT NULL
);

CREATE TABLE verification_tokens (
  identifier text NOT NULL,
  token text UNIQUE NOT NULL,
  expires timestamptz NOT NULL,
  UNIQUE(identifier, token)
);

ALTER TABLE users ADD COLUMN email text UNIQUE;
ALTER TABLE users ADD COLUMN "emailVerified" timestamptz;
ALTER TABLE users ADD COLUMN image text;
ALTER TABLE users ADD COLUMN password_hash text;
