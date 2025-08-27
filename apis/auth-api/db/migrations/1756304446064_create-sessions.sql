-- Up Migration

CREATE TABLE IF NOT EXISTS sessions (
  sid                  uuid PRIMARY KEY,
  user_id              text NOT NULL,
  aud                  text NOT NULL,
  current_refresh_jti  uuid NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  revoked_at           timestamptz NULL,
  invalidate_before    timestamptz NULL,
  refresh_expires_at   timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_aud  ON sessions(aud);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_exp ON sessions(refresh_expires_at);

-- Down Migration

DROP INDEX IF EXISTS idx_sessions_refresh_exp;
DROP INDEX IF EXISTS idx_sessions_aud;
DROP INDEX IF EXISTS idx_sessions_user;
DROP TABLE IF EXISTS sessions;
