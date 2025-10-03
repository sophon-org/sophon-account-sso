import { CONSENT_SHORT } from "./dto/consent-kind.enum";
import type { ConsentRecord } from "./consent.domain";
import type { ConsentClaims, ConsentKeyShort } from "../auth/types";

export function toConsentClaims(rows: Pick<ConsentRecord, "kind" | "startTime">[]): ConsentClaims | undefined {
  if (!rows.length) return undefined;
  const out: ConsentClaims = {};
  for (const r of rows) {
    const k = CONSENT_SHORT[r.kind] as ConsentKeyShort;
    out[k] = Math.floor(r.startTime.getTime() / 1000);
  }
  return Object.keys(out).length ? out : undefined;
}
