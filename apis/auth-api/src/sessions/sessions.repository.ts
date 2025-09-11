import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { Session } from "./session.entity";

@Injectable()
export class SessionsRepository {
	constructor(
		@InjectRepository(Session)
		private repo: Repository<Session>,
	) {}

	async create(params: {
		sid: string;
		userId: string;
		aud: string;
		currentRefreshJti: string;
		refreshExpiresAt: Date;
	}): Promise<void> {
		const session = this.repo.create({
			sid: params.sid,
			userId: params.userId,
			aud: params.aud,
			currentRefreshJti: params.currentRefreshJti,
			refreshExpiresAt: params.refreshExpiresAt,
		});
		await this.repo.save(session);
	}

	async getBySid(sid: string): Promise<Session | null> {
		return this.repo.findOne({ where: { sid } });
	}

	async rotateRefreshJti(params: {
		sid: string;
		newJti: string;
		newRefreshExpiresAt?: Date;
	}): Promise<void> {
		await this.repo.update(
			{ sid: params.sid },
			{
				currentRefreshJti: params.newJti,
				...(params.newRefreshExpiresAt && {
					refreshExpiresAt: params.newRefreshExpiresAt,
				}),
			},
		);
	}

	async revokeSid(sid: string): Promise<void> {
		await this.repo.update({ sid }, { revokedAt: new Date() });
	}

	async revokeAllForUser(userId: string): Promise<void> {
		await this.repo.update(
			{ userId, revokedAt: IsNull() },
			{ revokedAt: new Date() },
		);
	}

	async invalidateAccessBefore(params: {
		sid: string;
		ts: Date;
	}): Promise<void> {
		await this.repo.update(
			{ sid: params.sid },
			{ invalidateBefore: params.ts },
		);
	}

	isActive(row: Session | null): row is Session {
		return (
			!!row && !row.revokedAt && new Date(row.refreshExpiresAt) > new Date()
		);
	}
}
