// utils/jwt.ts
import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";

/**
 * Caches
 */
let privateKeyPemCache: string | null = null;
let publicKeyPemCache: string | null = null;

let privateKeyObjCache: KeyObject | null = null;
let publicKeyObjCache: KeyObject | null = null;

/** NEW: Refresh key caches */
let refreshPrivateKeyPemCache: string | null = null;
let refreshPublicKeyPemCache: string | null = null;

let refreshPrivateKeyObjCache: KeyObject | null = null;
let refreshPublicKeyObjCache: KeyObject | null = null;

/**
 * Return the raw PEM strings for jsonwebtoken.
 * jsonwebtoken accepts PEM strings directly, so this is usually all you need.
 */
export async function getPrivateKeyPem(): Promise<string> {
	if (privateKeyPemCache) return privateKeyPemCache;

	const pem = process.env.PRIVATE_KEY?.replace(/\\n/g, "\n");
	if (!pem) throw new Error("PRIVATE_KEY is not set");

	privateKeyPemCache = pem;
	return pem;
}

export async function getPublicKeyPem(): Promise<string> {
	if (publicKeyPemCache) return publicKeyPemCache;

	const pem = process.env.PUBLIC_KEY?.replace(/\\n/g, "\n");
	if (!pem) throw new Error("PUBLIC_KEY is not set");

	publicKeyPemCache = pem;
	return pem;
}

export async function getRefreshPrivateKeyPem(): Promise<string> {
	if (refreshPrivateKeyPemCache) return refreshPrivateKeyPemCache;

	const pem = process.env.REFRESH_PRIVATE_KEY?.replace(/\\n/g, "\n");
	if (!pem) throw new Error("REFRESH_PRIVATE_KEY is not set");

	refreshPrivateKeyPemCache = pem;
	return pem;
}

export async function getRefreshPublicKeyPem(): Promise<string> {
	if (refreshPublicKeyPemCache) return refreshPublicKeyPemCache;

	const pem = process.env.REFRESH_PUBLIC_KEY?.replace(/\\n/g, "\n");
	if (!pem) throw new Error("REFRESH_PUBLIC_KEY is not set");

	refreshPublicKeyPemCache = pem;
	return pem;
}

/**
 * Optional: Return Node KeyObjects (validated/parsed).
 * jsonwebtoken also accepts KeyObjects if you prefer.
 */
export async function getPrivateKeyObject(): Promise<KeyObject> {
	if (privateKeyObjCache) return privateKeyObjCache;
	const pem = await getPrivateKeyPem();
	privateKeyObjCache = createPrivateKey({ key: pem });
	return privateKeyObjCache;
}

export async function getPublicKeyObject(): Promise<KeyObject> {
	if (publicKeyObjCache) return publicKeyObjCache;
	const pem = await getPublicKeyPem();
	publicKeyObjCache = createPublicKey({ key: pem });
	return publicKeyObjCache;
}

export async function getRefreshPrivateKeyObject(): Promise<KeyObject> {
	if (refreshPrivateKeyObjCache) return refreshPrivateKeyObjCache;
	const pem = await getRefreshPrivateKeyPem();
	refreshPrivateKeyObjCache = createPrivateKey({ key: pem });
	return refreshPrivateKeyObjCache;
}

export async function getRefreshPublicKeyObject(): Promise<KeyObject> {
	if (refreshPublicKeyObjCache) return refreshPublicKeyObjCache;
	const pem = await getRefreshPublicKeyPem();
	refreshPublicKeyObjCache = createPublicKey({ key: pem });
	return refreshPublicKeyObjCache;
}

/**
 * Backwards compatibility helpers (if other code was calling getPrivateKey/getPublicKey).
 * Now they return PEM strings instead of CryptoKey.
 */
export const getPrivateKey = getPrivateKeyPem;
export const getPublicKey = getPublicKeyPem;

/** NEW: Back-compat aliases for refresh keys (PEM) */
export const getRefreshPrivateKey = getRefreshPrivateKeyPem;
export const getRefreshPublicKey = getRefreshPublicKeyPem;
