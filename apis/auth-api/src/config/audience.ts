import { ALLOWED_AUDIENCES as ALLOWED_AUDIENCES_LIST } from "./env";

export const ALLOWED_AUDIENCES = new Set(ALLOWED_AUDIENCES_LIST);

export function assertAllowedAudience(aud: string) {
  if (!ALLOWED_AUDIENCES.has(aud)) {
    throw new Error(`Audience not allowed: ${aud}`);
  }
}