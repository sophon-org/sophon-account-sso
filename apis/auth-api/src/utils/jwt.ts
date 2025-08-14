const joseP = import("jose");

let privateKeyCache: CryptoKey | null = null;
let publicKeyCache: CryptoKey | null = null;

export async function getPrivateKey(): Promise<CryptoKey> {
	const { importPKCS8 } = await joseP;
	if (privateKeyCache) return privateKeyCache;

	const pem = process.env.PRIVATE_KEY?.replace(/\\n/g, "\n");
	if (!pem) throw new Error("PRIVATE_KEY is not set");

	privateKeyCache = await importPKCS8(pem, "RS256");
	return privateKeyCache;
}

export async function getPublicKey(): Promise<CryptoKey> {
	const { importSPKI } = await joseP;
	if (publicKeyCache) return publicKeyCache;

	const pem = process.env.PUBLIC_KEY?.replace(/\\n/g, "\n");
	if (!pem) throw new Error("PUBLIC_KEY is not set");

	publicKeyCache = await importSPKI(pem, "RS256");
	return publicKeyCache;
}
