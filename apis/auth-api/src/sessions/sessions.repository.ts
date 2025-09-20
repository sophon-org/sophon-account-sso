import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Repository } from "typeorm";
import type { SessionRecord } from "./session.domain";
import { Session } from "./session.entity";

export type CreateSessionParams = Pick<
	SessionRecord,
	"sid" | "userId" | "aud" | "currentRefreshJti" | "refreshExpiresAt"
> &
	Partial<Pick<SessionRecord, "createdIp" | "createdUserAgent">>;

const toDomain = (e: Session): SessionRecord => ({
	sid: e.sid,
	userId: e.userId,
	aud: e.aud,
	currentRefreshJti: e.currentRefreshJti,
	createdAt: e.createdAt,
	revokedAt: e.revokedAt,
	invalidateBefore: e.invalidateBefore,
	refreshExpiresAt: e.refreshExpiresAt,

	lastRefreshIp: e.lastRefreshIp ?? null,
	lastRefreshUserAgent: e.lastRefreshUserAgent ?? null,
	lastRefreshAt: e.lastRefreshAt ?? null,

	createdIp: e.createdIp ?? null,
	createdUserAgent: e.createdUserAgent ?? null,
});

@Injectable()
export class SessionsRepository {
	constructor(@InjectRepository(Session) private repo: Repository<Session>) {}

	async create(params: CreateSessionParams): Promise<void> {
		await this.repo.save(this.repo.create(params));
	}

	async getBySid(sid: SessionRecord["sid"]): Promise<SessionRecord | null> {
		const row = await this.repo.findOne({ where: { sid } });
		return row ? toDomain(row) : null;
	}

	async findActiveForUser(userId: string): Promise<SessionRecord[]> {
		const now = new Date();
		const rows = await this.repo.find({
			where: { userId, revokedAt: IsNull(), refreshExpiresAt: MoreThan(now) },
			order: { createdAt: "DESC" },
		});
		return rows.map(toDomain);
	}

	async getActiveForUser(
		userId: SessionRecord["userId"],
	): Promise<SessionRecord[]> {
		const now = new Date();
		const rows = await this.repo.find({
			where: { userId, revokedAt: IsNull(), refreshExpiresAt: MoreThan(now) },
			order: { createdAt: "DESC" },
		});
		return rows.map(toDomain);
	}

	async ensureOwnedByUser(sid: string, userId: string): Promise<void> {
		const row = await this.repo.findOne({ where: { sid } });
		if (!row || row.userId !== userId) {
			throw new Error("not_found_or_forbidden");
		}
	}

	async rotateRefreshJti(args: {
		sid: SessionRecord["sid"];
		newJti: SessionRecord["currentRefreshJti"];
		newRefreshExpiresAt?: SessionRecord["refreshExpiresAt"];
		ip?: string | null;
		userAgent?: string | null;
		ts?: Date;
	}): Promise<void> {
		const setMeta =
			args.ip !== undefined ||
			args.userAgent !== undefined ||
			args.ts !== undefined;

		await this.repo.update(
			{ sid: args.sid },
			{
				currentRefreshJti: args.newJti,
				...(args.newRefreshExpiresAt && {
					refreshExpiresAt: args.newRefreshExpiresAt,
				}),
				...(setMeta && {
					lastRefreshIp: args.ip ?? null,
					lastRefreshUserAgent: args.userAgent ?? null,
					lastRefreshAt: args.ts ?? new Date(),
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
