// src/consents/__tests__/consent-claims.util.spec.ts

import { ConsentKind } from "src/consents/dto/consent-kind.enum"; // 👈 use the real enum
import { toConsentClaims } from "../../consents/consent-claims.util";

type ConsentRecordInput = { kind: ConsentKind; startTime: Date };

const rec = (kind: ConsentKind, d: Date): ConsentRecordInput => ({
	kind,
	startTime: d,
});
const unix = (d: Date) => Math.floor(d.getTime() / 1000);

describe("toConsentClaims (array-of-records -> short-key unix timestamps)", () => {
	it("returns two short keys with unix seconds when both kinds are present", () => {
		const a = new Date("2025-01-01T00:00:00.000Z");
		const b = new Date("2025-01-02T00:00:00.000Z");

		const claims = toConsentClaims([
			rec(ConsentKind.PERSONALIZATION_ADS, a),
			rec(ConsentKind.SHARING_DATA, b),
		]);

		expect(claims).toBeDefined();
		const values = Object.values(claims as Record<string, number>);
		expect(values).toEqual(expect.arrayContaining([unix(a), unix(b)]));
	});

	it("returns a single short key when only PERSONALIZATION_ADS exists", () => {
		const a = new Date("2025-01-03T00:00:00.000Z");

		const claims = toConsentClaims([rec(ConsentKind.PERSONALIZATION_ADS, a)]);
		expect(claims).toBeDefined();

		const entries = Object.entries(claims as Record<string, number>);
		expect(entries.length).toBe(1);
		expect(entries[0][1]).toBe(unix(a));
	});

	it("returns a single short key when only SHARING_DATA exists", () => {
		const a = new Date("2025-01-04T00:00:00.000Z");

		const claims = toConsentClaims([rec(ConsentKind.SHARING_DATA, a)]);
		expect(claims).toBeDefined();

		const entries = Object.entries(claims as Record<string, number>);
		expect(entries.length).toBe(1);
		expect(entries[0][1]).toBe(unix(a));
	});

	it("returns undefined when no consent records are provided", () => {
		const none: ConsentRecordInput[] = [];
		const claims = toConsentClaims(none);
		expect(claims).toBeUndefined();
	});

	it("when multiple records of the same kind exist, the last occurrence wins", () => {
		const early = new Date("2025-01-05T00:00:00.000Z");
		const late = new Date("2025-01-06T00:00:00.000Z");

		const claims = toConsentClaims([
			rec(ConsentKind.PERSONALIZATION_ADS, early),
			rec(ConsentKind.PERSONALIZATION_ADS, late),
		]);

		const entries = Object.entries(claims as Record<string, number>);
		expect(entries.length).toBe(1);
		expect(entries[0][1]).toBe(unix(late));
	});
});
