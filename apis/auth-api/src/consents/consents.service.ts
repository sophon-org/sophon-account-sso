import { Injectable } from "@nestjs/common";
import type { ConsentRecord } from "./consent.domain";
import {
	ConsentsRepository,
	type GiveConsentParams,
} from "./consents.repository";
import { ConsentKind } from "./dto/consent-kind.enum";

@Injectable()
export class ConsentsService {
	constructor(private readonly repo: ConsentsRepository) {}

	findActiveForUser(userId: string): Promise<ConsentRecord[]> {
		return this.repo.findActiveForUser(userId);
	}

	getActiveForUserKind(
		userId: string,
		kind: ConsentKind,
	): Promise<ConsentRecord | null> {
		return this.repo.getActiveForUserKind(userId, kind);
	}

	give(userId: string, kind: ConsentKind): Promise<ConsentRecord> {
		const params: GiveConsentParams = { userId, kind };
		return this.repo.give(params);
	}

	revoke(userId: string, kind: ConsentKind): Promise<boolean> {
		return this.repo.revoke(userId, kind);
	}

	history(userId: string, kind?: ConsentKind): Promise<ConsentRecord[]> {
		return this.repo.history(userId, kind);
	}

	getActiveConsents(userId: string): Promise<ConsentRecord[]> {
		return this.findActiveForUser(userId);
	}

	async giveMany(userId: string, kinds: ConsentKind[]) {
		const uniq = [...new Set(kinds)];
		return Promise.all(uniq.map((k) => this.give(userId, k)));
	}

	async revokeMany(userId: string, kinds: ConsentKind[]) {
		const uniq = [...new Set(kinds)];
		const results = await Promise.all(uniq.map((k) => this.revoke(userId, k)));
		return { changed: results.filter(Boolean).length };
	}
}
