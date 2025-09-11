import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Session } from "./session.entity";
import type { SessionRecord } from "./session.domain";

const toDomain = (e: Session): SessionRecord => ({
	sid: e.sid,
	userId: e.userId,
	aud: e.aud,
	currentRefreshJti: e.currentRefreshJti,
	createdAt: e.createdAt,
	revokedAt: e.revokedAt,
	invalidateBefore: e.invalidateBefore,
	refreshExpiresAt: e.refreshExpiresAt,
});

@Injectable()
export class SessionsRepository {
	constructor(@InjectRepository(Session) private repo: Repository<Session>) {}

	async create(
		params: Pick<
			SessionRecord,
			"sid" | "userId" | "aud" | "currentRefreshJti" | "refreshExpiresAt"
		>,
	): Promise<void> {
		await this.repo.save(this.repo.create(params));
	}

	async getBySid(sid: SessionRecord["sid"]): Promise<SessionRecord | null> {
		const row = await this.repo.findOne({ where: { sid } });
		return row ? toDomain(row) : null;
	}

	async rotateRefreshJti(args: {
		sid: SessionRecord["sid"];
		newJti: SessionRecord["currentRefreshJti"];
		newRefreshExpiresAt?: SessionRecord["refreshExpiresAt"];
	}): Promise<void> {
		await this.repo.update(
			{ sid: args.sid },
			{
				currentRefreshJti: args.newJti,
				...(args.newRefreshExpiresAt && {
					refreshExpiresAt: args.newRefreshExpiresAt,
				}),
			},
		);
	}

	async revokeSid(sid: SessionRecord["sid"]): Promise<void> {
		await this.repo.update({ sid }, { revokedAt: new Date() });
	}

	async revokeAllForUser(userId: SessionRecord["userId"]): Promise<void> {
		await this.repo.update(
			{ userId, revokedAt: IsNull() },
			{ revokedAt: new Date() },
		);
	}

	async invalidateAccessBefore(params: {
		sid: SessionRecord["sid"];
		ts: Date;
	}): Promise<void> {
		await this.repo.update(
			{ sid: params.sid },
			{ invalidateBefore: params.ts },
		);
	}

	isActive(row: SessionRecord | null): row is SessionRecord {
		return !!row && !row.revokedAt && row.refreshExpiresAt > new Date();
	}
}
