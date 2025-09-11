// sessions/sessions.repository.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
			user_id: params.userId,
			aud: params.aud,
			current_refresh_jti: params.currentRefreshJti,
			refresh_expires_at: params.refreshExpiresAt,
		});
		await this.repo.save(session);
	}

	async getBySid(sid: string): Promise<Session | null> {
		return await this.repo.findOne({ where: { sid } });
	}

	async rotateRefreshJti(params: {
		sid: string;
		newJti: string;
		newRefreshExpiresAt?: Date;
	}): Promise<void> {
		await this.repo.update(params.sid, {
			current_refresh_jti: params.newJti,
			...(params.newRefreshExpiresAt && {
				refresh_expires_at: params.newRefreshExpiresAt,
			}),
		});
	}

	async revokeSid(sid: string): Promise<void> {
		await this.repo.update(sid, { revoked_at: new Date() });
	}

	async revokeAllForUser(userId: string): Promise<void> {
		await this.repo
			.createQueryBuilder()
			.update(Session)
			.set({ revoked_at: () => "NOW()" })
			.where("user_id = :userId", { userId })
			.andWhere("revoked_at IS NULL")
			.execute();
	}

	async invalidateAccessBefore(params: {
		sid: string;
		ts: Date;
	}): Promise<void> {
		await this.repo.update(params.sid, { invalidate_before: params.ts });
	}

	isActive(row: Session | null): row is Session {
		return (
			!!row && !row.revoked_at && new Date(row.refresh_expires_at) > new Date()
		);
	}
}
