import { Injectable } from "@nestjs/common";
import { ConsentsRepository } from "./consents.repository";
import { ConsentKind } from "./dto/consent-kind.enum";

@Injectable()
export class ConsentsService {
	constructor(private readonly repo: ConsentsRepository) {}

	findActiveForSub(sub: string) {
		return this.repo.findActiveForSub(sub);
	}

	getActiveForUserKind(sub: string, kind: ConsentKind) {
		return this.repo.getActiveForUserKind(sub, kind);
	}

	give(sub: string, kind: ConsentKind) {
		return this.repo.give({ sub, kind });
	}

	revoke(sub: string, kind: ConsentKind) {
		return this.repo.revoke(sub, kind);
	}

	history(sub: string, kind?: ConsentKind) {
		return this.repo.history(sub, kind);
	}

	getActiveConsents(sub: string) {
		return this.findActiveForSub(sub);
	}

	async giveMany(sub: string, kinds: ConsentKind[]) {
		const uniq = [...new Set(kinds)];
		return Promise.all(uniq.map((k) => this.give(sub, k)));
	}

	async revokeMany(sub: string, kinds: ConsentKind[]) {
		const uniq = [...new Set(kinds)];
		const results = await Promise.all(uniq.map((k) => this.revoke(sub, k)));
		return { changed: results.filter(Boolean).length };
	}
}
