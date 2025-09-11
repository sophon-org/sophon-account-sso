// src/migrations/1700000000000-CreateSessions.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessions1700000000000 implements MigrationInterface {
	public async up(q: QueryRunner): Promise<void> {
		await q.query(`
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
    `);
	}

	public async down(q: QueryRunner): Promise<void> {
		await q.query(`
      DROP TABLE IF EXISTS sessions;
    `);
	}
}
