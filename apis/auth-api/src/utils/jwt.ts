// utils/jwt.ts
import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";
import { loadJwtSecrets } from "../aws/secrets-jwt";

const useSecrets = !!process.env.SECRET_ID_JWT_KEYS || !!process.env.APP_ENV;

function fromEnvOrThrow(name: string) {
	const v = process.env[name];
	if (!v) throw new Error(`${name} is not set`);
	return v.includes("\\n") ? v.replace(/\\n/g, "\n") : v;
}

// PEM getters (jsonwebtoken prefers PEM)
export async function getPrivateKeyPem() {
	return useSecrets
		? (await loadJwtSecrets()).access.privateKeyPem
		: fromEnvOrThrow("PRIVATE_KEY");
}
export async function getPublicKeyPem() {
	return useSecrets
		? (await loadJwtSecrets()).access.publicKeyPem
		: fromEnvOrThrow("PUBLIC_KEY");
}
export async function getRefreshPrivateKeyPem() {
	return useSecrets
		? (await loadJwtSecrets()).refresh.privateKeyPem
		: fromEnvOrThrow("REFRESH_PRIVATE_KEY");
}
export async function getRefreshPublicKeyPem() {
	return useSecrets
		? (await loadJwtSecrets()).refresh.publicKeyPem
		: fromEnvOrThrow("REFRESH_PUBLIC_KEY");
}

let pkObj: KeyObject | null = null;
let pubObj: KeyObject | null = null;
let rpkObj: KeyObject | null = null;
let rpubObj: KeyObject | null = null;
export async function getPrivateKeyObject() {
	if (!pkObj) pkObj = createPrivateKey({ key: await getPrivateKeyPem() });
	return pkObj;
}
export async function getPublicKeyObject() {
	if (!pubObj) pubObj = createPublicKey({ key: await getPublicKeyPem() });
	return pubObj;
}
export async function getRefreshPrivateKeyObject() {
	if (!rpkObj)
		rpkObj = createPrivateKey({ key: await getRefreshPrivateKeyPem() });
	return rpkObj;
}
export async function getRefreshPublicKeyObject() {
	if (!rpubObj)
		rpubObj = createPublicKey({ key: await getRefreshPublicKeyPem() });
	return rpubObj;
}

/**
 * Backwards compatibility helpers (if other code was calling getPrivateKey/getPublicKey).
 * Now they return PEM strings instead of CryptoKey.
 */
export const getPrivateKey = getPrivateKeyPem;
export const getPublicKey = getPublicKeyPem;

export const getRefreshPrivateKey = getRefreshPrivateKeyPem;
export const getRefreshPublicKey = getRefreshPublicKeyPem;

export async function getAccessKid() {
	return useSecrets
		? (await loadJwtSecrets()).access.kid
		: fromEnvOrThrow("JWT_KID");
}
export async function getRefreshKid() {
	return useSecrets
		? (await loadJwtSecrets()).refresh.kid
		: fromEnvOrThrow("REFRESH_JWT_KID");
}
