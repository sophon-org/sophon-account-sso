import type { ConsentClaims, DecodedToken } from '../types/consent';

/**
 * Utility functions for handling consent claims in JWT tokens
 */

/**
 * Decode JWT and extract consent claims
 * @param token - JWT access token string
 * @returns Consent claims object or undefined
 */
export function getConsentClaimsFromToken(
  token: string | undefined,
): ConsentClaims | undefined {
  if (!token) return undefined;

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;

    // Decode base64 payload
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload ?? '')) as DecodedToken;

    return decoded.c;
  } catch {
    return undefined;
  }
}

/**
 * Check if user has given both required consents
 * @param token - JWT access token string
 * @returns true if both PERSONALIZATION_ADS and SHARING_DATA consents exist
 */
export function hasRequiredConsents(token: string | undefined): boolean {
  const claims = getConsentClaimsFromToken(token);
  if (!claims) return false;

  // Both consent types must be present
  return claims.pa !== undefined && claims.sd !== undefined;
}
