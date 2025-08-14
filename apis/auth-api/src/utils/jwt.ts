// utils/jwt.ts
import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";

/**
 * Caches
 */
let privateKeyPemCache: string | null = null;
let publicKeyPemCache: string | null = null;

let privateKeyObjCache: KeyObject | null = null;
let publicKeyObjCache: KeyObject | null = null;

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

/**
 * Backwards compatibility helpers (if other code was calling getPrivateKey/getPublicKey).
 * Now they return PEM strings instead of CryptoKey.
 */
export const getPrivateKey = getPrivateKeyPem;
export const getPublicKey = getPublicKeyPem;
