import { Pool } from "pg";
import { getEnv } from "../config/env";

export type SessionRow = {
	sid: string;
	user_id: string;
	aud: string;
	current_refresh_jti: string;
	created_at: string;
	revoked_at: string | null;
	invalidate_before: string | null;
	refresh_expires_at: string;
};

export class SessionsRepository {
	private pool = new Pool({ connectionString: getEnv().DATABASE_URL });

	async create(params: {
		sid: string;
		userId: string;
		aud: string;
		currentRefreshJti: string;
		refreshExpiresAt: Date;
	}): Promise<void> {
		await this.pool.query(
			`
      INSERT INTO sessions (sid, user_id, aud, current_refresh_jti, refresh_expires_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (sid) DO NOTHING
      `,
			[
				params.sid,
				params.userId,
				params.aud,
				params.currentRefreshJti,
				params.refreshExpiresAt.toISOString(),
			],
		);
	}

	async getBySid(sid: string): Promise<SessionRow | null> {
		const r = await this.pool.query<SessionRow>(
			"SELECT * FROM sessions WHERE sid = $1",
			[sid],
		);
		return r.rows[0] ?? null;
	}

	async rotateRefreshJti(params: {
		sid: string;
		newJti: string;
		newRefreshExpiresAt?: Date;
	}): Promise<void> {
		const { sid, newJti, newRefreshExpiresAt } = params;
		await this.pool.query(
			`
      UPDATE sessions
      SET current_refresh_jti = $2,
          ${newRefreshExpiresAt ? "refresh_expires_at = $3," : ""}
          -- keep audit-friendly updated_at if you add one later
          revoked_at = revoked_at
      WHERE sid = $1
      `,
			newRefreshExpiresAt
				? [sid, newJti, newRefreshExpiresAt.toISOString()]
				: [sid, newJti],
		);
	}

	async revokeSid(sid: string): Promise<void> {
		await this.pool.query(
			"UPDATE sessions SET revoked_at = NOW() WHERE sid = $1",
			[sid],
		);
	}

	async revokeAllForUser(userId: string): Promise<void> {
		await this.pool.query(
			"UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
			[userId],
		);
	}

	async invalidateAccessBefore(params: {
		sid: string;
		ts: Date;
	}): Promise<void> {
		await this.pool.query(
			"UPDATE sessions SET invalidate_before = $2 WHERE sid = $1",
			[params.sid, params.ts.toISOString()],
		);
	}

	isActive(row: SessionRow | null): row is SessionRow {
		return (
			!!row && !row.revoked_at && new Date(row.refresh_expires_at) > new Date()
		);
	}
}
