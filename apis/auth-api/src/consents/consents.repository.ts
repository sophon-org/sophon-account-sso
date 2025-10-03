import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import type { ConsentRecord } from "./consent.domain";
import { ConsentKind } from "./dto/consent-kind.enum";
import { UserConsent } from "./user-consent.entity";

const toDomain = (e: UserConsent): ConsentRecord => ({
	userId: e.userId,
	kind: e.kind,
	startTime: e.startTime,
	endTime: e.endTime,
});

export type GiveConsentParams = {
	userId: string;
	kind: ConsentKind;
	startTime?: Date;
};

@Injectable()
export class ConsentsRepository {
	constructor(
		@InjectRepository(UserConsent) private repo: Repository<UserConsent>,
	) {}

	async findActiveForUser(userId: string): Promise<ConsentRecord[]> {
		const rows = await this.repo.find({
			where: { userId, endTime: IsNull() },
			order: { kind: "ASC", startTime: "DESC" },
		});
		return rows.map(toDomain);
	}

	async getActiveForUserKind(
		userId: string,
		kind: ConsentKind,
	): Promise<ConsentRecord | null> {
		const row = await this.repo.findOne({
			where: { userId, kind, endTime: IsNull() },
			order: { startTime: "DESC" },
		});
		return row ? toDomain(row) : null;
	}

	async give(params: GiveConsentParams): Promise<ConsentRecord> {
		const start = params.startTime ?? new Date();

		return this.repo.manager.transaction(async (em) => {

			const active = await em.findOne(UserConsent, {
				where: { userId: params.userId, kind: params.kind, endTime: IsNull() },
				order: { startTime: "DESC" },
			});
			if (active) {
				active.endTime = start;
				await em.save(active);
			}


			const res = await em
				.createQueryBuilder()
				.insert()
				.into(UserConsent)
				.values({
					userId: params.userId,
					kind: params.kind,
					startTime: start,
					endTime: null,
				})
				.orIgnore()
				.returning("*")
				.execute();

			if (res.raw?.length) return toDomain(res.raw[0] as UserConsent);

			// If conflicted, read the active one and return
			const current = await em.findOne(UserConsent, {
				where: { userId: params.userId, kind: params.kind, endTime: IsNull() },
				order: { startTime: "DESC" },
			});
			if (!current)
				throw new Error("unexpected: consent not inserted nor found active");
			return toDomain(current);
		});
	}

	async revoke(
		userId: string,
		kind: ConsentKind,
		end = new Date(),
	): Promise<boolean> {
		return this.repo.manager.transaction(async (em) => {
			const active = await em.findOne(UserConsent, {
				where: { userId, kind, endTime: IsNull() },
				order: { startTime: "DESC" },
			});
			if (!active) return false;
			active.endTime = end;
			await em.save(active);
			return true;
		});
	}

	async history(userId: string, kind?: ConsentKind): Promise<ConsentRecord[]> {
		const rows = await this.repo.find({
			where: { userId, ...(kind ? { kind } : {}) },
			order: { startTime: "DESC" },
		});
		return rows.map(toDomain);
	}
}
