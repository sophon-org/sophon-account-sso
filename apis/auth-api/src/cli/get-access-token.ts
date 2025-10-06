import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { sophon, sophonTestnet } from "viem/chains";

// ---------- Config ----------
const RAW_BASE = process.env.AUTH_BASE_URL ?? "http://localhost:3000";
const BASE = /^https?:\/\//i.test(RAW_BASE) ? RAW_BASE : `https://${RAW_BASE}`;

const PRIVATE_KEY_ENV = process.env.PRIVATE_KEY ?? ""; // owner EOA key
const ACCOUNT_ADDRESS_ENV = process.env.ACCOUNT_ADDRESS ?? ""; // 1271 contract (Safe) address
const PARTNER_ID = process.env.PARTNER_ID ?? process.env.AUTH_PARTNER_ID ?? "";
const AUTH_FIELDS_CSV = process.env.AUTH_FIELDS ?? ""; // e.g. "email,google"
const USER_ID = process.env.USER_ID?.trim() || undefined;
const SIGN_CHAIN_ID_ENV = process.env.SIGN_CHAIN_ID
	? Number(process.env.SIGN_CHAIN_ID)
	: undefined;

// ---------- Types ----------
const AUTH_FIELDS_ALLOWED = [
	"discord",
	"email",
	"google",
	"telegram",
	"x",
] as const;
type AuthField = (typeof AUTH_FIELDS_ALLOWED)[number];

type VerifyResp = {
	accessToken: string;
	refreshToken?: string;
	sid?: string;
	accessTokenExpiresAt?: number;
	refreshTokenExpiresAt?: number;
};

type K1OwnerState = {
	id: string;
	k1Owner: string;
	accounts: string[];
};

// ---------- Helpers ----------
function normalizePkTo0x32Bytes(pk: string): `0x${string}` {
	let hex = (pk || "").trim().toLowerCase();
	if (hex.startsWith("0x")) hex = hex.slice(2);
	hex = hex.replace(/[^0-9a-f]/g, "");
	if (hex.length % 2 === 1) hex = `0${hex}`;
	if (hex.length > 64) throw new Error(`PRIVATE_KEY too long (${hex.length}).`);
	hex = hex.padStart(64, "0");
	return `0x${hex}` as `0x${string}`;
}

const isAuthField = (s: string): s is AuthField =>
	(AUTH_FIELDS_ALLOWED as readonly string[]).includes(s);

function parseFields(csv: string | undefined): AuthField[] {
	const arr = (csv ?? "")
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean)
		.filter(isAuthField);
	return arr.length === 0 ? ["email"] : arr.slice(0, 16);
}

// Abort/timeout helper without ts-ignore
function makeTimeoutSignal(ms = 15_000): AbortSignal {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), ms);
	// In Node, avoid keeping the process alive
	// Cast to access optional unref without suppressing lints
	(t as unknown as { unref?: () => void }).unref?.();
	return ctrl.signal;
}

async function httpJSON<T>(
	method: "GET" | "POST",
	path: string,
	body?: unknown,
	opts?: { bearer?: string; timeoutMs?: number },
): Promise<T> {
	const url = new URL(path, BASE);
	const headers: Record<string, string> = {
		accept: "application/json",
	};
	if (method === "POST") headers["content-type"] = "application/json"; // hyphen requires bracket notation
	if (opts?.bearer) headers.authorization = `Bearer ${opts.bearer}`;

	const res = await fetch(url, {
		method,
		headers,
		body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
		signal: makeTimeoutSignal(opts?.timeoutMs ?? 15_000),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(
			`${method} ${url} ${res.status} ${res.statusText} — ${text || "<no body>"}`,
		);
	}
	return (await res.json()) as T;
}

const postJSON = <T>(
	path: string,
	body: unknown,
	opts?: { bearer?: string; timeoutMs?: number },
) => httpJSON<T>("POST", path, body, opts);

const getJSON = <T>(
	path: string,
	opts?: { bearer?: string; timeoutMs?: number },
) => httpJSON<T>("GET", path, undefined, opts);

// ---------- Main ----------
(async () => {
	if (!PRIVATE_KEY_ENV) throw new Error("Set PRIVATE_KEY (owner EOA).");
	if (!PARTNER_ID) throw new Error("Set PARTNER_ID (registered partner).");

	const owner = privateKeyToAccount(normalizePkTo0x32Bytes(PRIVATE_KEY_ENV));
	const addressForServer = ACCOUNT_ADDRESS_ENV || owner.address; // MUST be a 1271 contract for your backend

	console.log(
		`Address used for auth (must be 1271 contract): ${addressForServer}`,
	);
	console.log(`Signed by owner EOA: ${owner.address}`);
	console.log(`Partner: ${PARTNER_ID}`);
	console.log(`Base: ${BASE}`);

	// 1) Get nonce JWT for the CONTRACT address (not the owner!)
	const fields = parseFields(AUTH_FIELDS_CSV);
	const nonceResp = await postJSON<{ nonce: string }>("/auth/nonce", {
		address: addressForServer,
		partnerId: PARTNER_ID,
		fields,
		userId: USER_ID,
	});

	const nonceToken = nonceResp.nonce;
	if (!nonceToken)
		throw new Error(`Unexpected /auth/nonce: ${JSON.stringify(nonceResp)}`);

	// 👇 print the nonce JWT (sensitive)
	console.log("Nonce JWT (sensitive):", nonceToken);

	// 2) Sign EIP-712 over candidate chainIds, then /auth/verify
	const candidates =
		SIGN_CHAIN_ID_ENV != null
			? [SIGN_CHAIN_ID_ENV]
			: [sophon.id, sophonTestnet.id];

	let lastErr: unknown;
	for (const chainId of candidates) {
		try {
			const domain = { name: "Sophon SSO", version: "1", chainId } as const;
			const types = {
				Verify: [
					{ name: "from", type: "address" },
					{ name: "audience", type: "string" },
					{ name: "nonce", type: "string" },
				],
			} as const;
			const message = {
				from: addressForServer as `0x${string}`,
				audience: PARTNER_ID,
				nonce: nonceToken,
			} as const;

			console.log("TypedData domain:", domain);
			console.log("TypedData message:", message);

			const signature = await owner.signTypedData({
				domain,
				types,
				primaryType: "Verify",
				message,
			});
			console.log("Signature:", signature);

			const verifyResp = await postJSON<VerifyResp>("/auth/verify", {
				address: addressForServer,
				typedData: { domain, types, primaryType: "Verify", message },
				signature,
				nonceToken,
			});

			console.log(`Verified with chainId=${chainId}`);
			console.log("Tokens:");
			console.log(JSON.stringify(verifyResp, null, 2));

			// 3) OPTIONAL sanity: check who we are
			// try {
			// 	const me = await getJSON<{
			// 		sub: string;
			// 		partnerId: string;
			// 		address: string;
			// 	}>("/auth/me", { bearer: verifyResp.accessToken, timeoutMs: 10_000 });
			// 	console.log("ME:", JSON.stringify(me, null, 2));
			// } catch (e) {
			// 	console.warn("ME failed:", (e as Error)?.message);
			// }

			// 4) Call protected endpoint as the SMART ACCOUNT: GET /me/k1-owner-state
			try {
				const url = `/me/k1-owner-state/${owner.address}`;
				const k1OwnerState = await getJSON<K1OwnerState[]>(url, {
					bearer: verifyResp.accessToken,
					timeoutMs: 12_000,
				});
				console.log(
					"K1OwnerState (explicit EOA):\n" +
						JSON.stringify(k1OwnerState, null, 2),
				);
			} catch (e) {
				const msg = (e as Error).message ?? String(e);
				if (msg.includes("404")) {
					console.error(
						"404 for /me/k1-owner-state/:owner — ensure HyperindexModule is imported and check any global prefix (e.g., /api).",
					);
				} else if (msg.includes("401") || msg.includes("403")) {
					console.error("Auth failed. Is the Bearer token valid/unexpired?");
				} else {
					console.error("GET /me/k1-owner-state/:owner failed:", msg);
				}
				// throw e; // uncomment to fail hard
			}

			return; // done
		} catch (e) {
			lastErr = e;
			// try next chainId
		}
	}
	throw lastErr;
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
