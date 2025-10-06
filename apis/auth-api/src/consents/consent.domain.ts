import { ConsentKind } from "./dto/consent-kind.enum";
import { UserConsent } from "./user-consent.entity";

export type ConsentRecord = {
	userId: string;
	kind: ConsentKind;
	startTime: Date;
	endTime: Date | null;
};

export const toDomain = (e: UserConsent): ConsentRecord => ({
	userId: e.userId,
	kind: e.kind,
	startTime: e.startTime,
	endTime: e.endTime,
});
