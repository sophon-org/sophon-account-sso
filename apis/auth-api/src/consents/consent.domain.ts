import { ConsentKind } from "./dto/consent-kind.enum";
import { UserConsent } from "./user-consent.entity";

export type ConsentRecord = {
	sub: string;
	kind: ConsentKind;
	startTime: Date;
	endTime: Date | null;
};

export const toDomain = (e: UserConsent): ConsentRecord => ({
	sub: e.sub,
	kind: e.kind,
	startTime: e.startTime,
	endTime: e.endTime,
});
