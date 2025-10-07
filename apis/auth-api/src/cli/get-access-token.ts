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

// NEW: which consents to give (comma-separated). Default: PERSONALIZATION_ADS
const CONSENTS_CSV =
	process.env.CONSENTS ?? process.env.CONSENT ?? "PERSONALIZATION_ADS";

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

type ConsentKind = "PERSONALIZATION_ADS" | "SHARING_DATA";

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

function parseConsents(csv: string | undefined): ConsentKind[] {
	const allowed: ConsentKind[] = ["PERSONALIZATION_ADS", "SHARING_DATA"];
	return (csv ?? "")
		.split(",")
		.map((s) => s.trim().toUpperCase())
		.filter((s): s is ConsentKind => (allowed as string[]).includes(s));
}

// Abort/timeout helper
function makeTimeoutSignal(ms = 15_000): AbortSignal {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), ms);
	(t as unknown as { unref?: () => void }).unref?.();
	return ctrl.signal;
}

type HttpOpts = {
	bearer?: string;
	timeoutMs?: number;
	headers?: Record<string, string>;
};

async function httpJSON<T>(
	method: "GET" | "POST" | "DELETE",
	path: string,
	body?: unknown,
	opts?: HttpOpts,
): Promise<T> {
	const url = new URL(path, BASE);
	const headers: Record<string, string> = {
		accept: "application/json",
		...(opts?.headers ?? {}),
	};
	if (method !== "GET") headers["content-type"] = "application/json";
	if (opts?.bearer) headers.authorization = `Bearer ${opts.bearer}`;

	const res = await fetch(url, {
		method,
		headers,
		body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
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

const postJSON = <T>(path: string, body: unknown, opts?: HttpOpts) =>
	httpJSON<T>("POST", path, body, opts);
const getJSON = <T>(path: string, opts?: HttpOpts) =>
	httpJSON<T>("GET", path, undefined, opts);

// ---------- Consent helpers ----------
const CONSENT_BASE = "/me/consent";

async function giveConsents(kinds: ConsentKind[], bearer: string) {
	if (kinds.length === 0) return;

	if (kinds.length === 1) {
		const kind = kinds[0];
		await postJSON<{ kind: ConsentKind; startTime: string }>(
			`${CONSENT_BASE}`,
			{ kind },
			{ bearer, timeoutMs: 10_000 },
		);
		console.log(`Gave consent: ${kind}`);
	} else {
		const rows = await postJSON<
			Array<{ kind: ConsentKind; startTime: string }>
		>(`${CONSENT_BASE}/giveMany`, { kinds }, { bearer, timeoutMs: 10_000 });
		console.log(`Gave consents: ${rows.map((r) => r.kind).join(", ")}`);
	}
}

const _REVOKE_CSV = process.env.REVOKE_CONSENTS ?? process.env.REVOKE ?? "";

// If you don't already have this:
const delJSON = <T>(path: string, opts?: HttpOpts) =>
	httpJSON<T>("DELETE", path, undefined, opts);

// Revoke + refresh helper
async function revokeConsentsAndRefresh(
	kinds: ConsentKind[],
	tokens: VerifyResp,
): Promise<VerifyResp> {
	if (kinds.length === 0) return tokens;
	const bearer = tokens.accessToken;

	if (kinds.length === 1) {
		const kind = kinds[0];
		await delJSON<{ ok: boolean; changed: number }>(`/me/consent/${kind}`, {
			bearer,
			timeoutMs: 10_000,
		});
		console.log(`Revoked consent: ${kind}`);
	} else {
		const resp = await postJSON<{ ok: boolean; changed: number }>(
			"/me/consent/revokeMany",
			{ kinds },
			{ bearer, timeoutMs: 10_000 },
		);
		console.log(`Revoked ${resp.changed}/${kinds.length} consents`);
	}

	const refreshed = await refreshTokens(tokens);
	if (!refreshed) {
		console.warn("Refresh failed; returning original tokens.");
		return tokens;
	}
	return refreshed;
}

// ---------- Refresh + JWT decode ----------
async function refreshTokens(prev: VerifyResp): Promise<VerifyResp | null> {
	// Try Bearer refreshToken
	if (prev.refreshToken) {
		try {
			return await postJSON<VerifyResp>(
				"/auth/refresh",
				{},
				{
					bearer: prev.refreshToken,
					timeoutMs: 10_000,
				},
			);
		} catch {}
		// Try body refreshToken
		try {
			return await postJSON<VerifyResp>(
				"/auth/refresh",
				{ refreshToken: prev.refreshToken },
				{
					timeoutMs: 10_000,
				},
			);
		} catch {}
	}
	// Try cookie-based session id
	if (prev.sid) {
		try {
			return await postJSON<VerifyResp>(
				"/auth/refresh",
				{},
				{
					timeoutMs: 10_000,
					headers: { cookie: `sid=${prev.sid}` },
				},
			);
		} catch {}
	}
	return null;
}

function decodeBase64Url<T = unknown>(segment: string): T {
	const pad =
		segment.length % 4 === 2 ? "==" : segment.length % 4 === 3 ? "=" : "";
	const s = segment.replace(/-/g, "+").replace(/_/g, "/") + pad;
	return JSON.parse(Buffer.from(s, "base64").toString("utf8")) as T;
}

// ---------- JSON & JWT types ----------
type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

type JwtHeader = {
	alg?: string;
	kid?: string;
	typ?: string;
} & JsonObject;

// What your access/refresh tokens actually carry
type JwtPayloadBase = {
	sub?: string;
	aud?: string;
	iss?: string;
	exp?: number; // seconds
	iat?: number; // seconds
	typ?: string;
	scope?: string;
	userId?: string;
	sid?: string;
	// consent claims live here (epoch seconds or stringified)
	c?: Record<string, number | string>;
} & JsonObject;

// ---------- Refresh + JWT decode ----------

function decodeJwt(token: string): {
	header: JwtHeader;
	payload: JwtPayloadBase;
} {
	const [h, p] = token.split(".");
	if (!h || !p) throw new Error("Invalid JWT format");
	return {
		header: decodeBase64Url<JwtHeader>(h),
		payload: decodeBase64Url<JwtPayloadBase>(p),
	};
}

// Map short claim keys -> consent kinds (adjust if you add more)
const CONSENT_CLAIM_KEYS: Record<string, ConsentKind> = {
	pa: "PERSONALIZATION_ADS",
	sd: "SHARING_DATA",
};

function extractConsentClaims(payload: JwtPayloadBase) {
	// Consent claims live under `c` (server side: toConsentClaims) — fall back to top level if absent
	const src: Record<string, unknown> =
		payload && typeof payload.c === "object" && payload.c !== null
			? (payload.c as Record<string, unknown>)
			: (payload as Record<string, unknown>);

	const out: Array<{ kind: ConsentKind; since: string; raw: number }> = [];
	for (const [key, kind] of Object.entries(CONSENT_CLAIM_KEYS)) {
		const v = src[key];
		if (typeof v === "number") {
			out.push({ kind, raw: v, since: new Date(v * 1000).toISOString() });
		} else if (typeof v === "string" && /^\d+$/.test(v)) {
			const n = Number(v);
			out.push({ kind, raw: n, since: new Date(n * 1000).toISOString() });
		}
	}
	return out.sort((a, b) => a.raw - b.raw);
}

function printTokenSummary(label: string, token: string) {
	const { payload } = decodeJwt(token);
	const expISO = payload?.exp
		? new Date(payload.exp * 1000).toISOString()
		: "n/a";
	const consents = extractConsentClaims(payload);
	console.log(`${label} (exp: ${expISO}) claims:`);
	console.log(
		JSON.stringify(
			{
				sub: payload.sub,
				userId: payload.userId,
				scope: payload.scope,
				aud: payload.aud,
				iss: payload.iss,
				sid: payload.sid,
				consents,
				rawConsentClaims: payload.c ?? null,
			},
			null,
			2,
		),
	);
}

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
			console.log("Tokens (initial):");
			console.log(JSON.stringify(verifyResp, null, 2));
			printTokenSummary("Access token (initial)", verifyResp.accessToken);

			// 3) Give consent(s) via /me/consent
			const consents = parseConsents(CONSENTS_CSV);
			if (consents.length > 0) {
				console.log("Giving consents:", consents.join(", "));
				await giveConsents(consents, verifyResp.accessToken);
			} else {
				console.log("No consents requested via CONSENTS env; skipping give.");
			}

			// 4) Refresh tokens so new consent claims are embedded, then print + decode
			let after = await refreshTokens(verifyResp);
			if (!after) {
				console.warn(
					"Refresh failed or not supported; using initial tokens (claims may not reflect new consent yet).",
				);
				after = verifyResp;
			}

			console.log("Tokens (after consent/refresh):");
			console.log(JSON.stringify(after, null, 2));
			printTokenSummary("Access token (after)", after.accessToken);

			// 4.1) Revoke consent(s) if requested, then refresh and print
			const revokeKinds = parseConsents("PERSONALIZATION_ADS");
			if (revokeKinds.length > 0) {
				console.log("Revoking consents:", revokeKinds.join(", "));
				after = await revokeConsentsAndRefresh(revokeKinds, after);

				console.log("Tokens (after revoke/refresh):");
				console.log(JSON.stringify(after, null, 2));
				printTokenSummary("Access token (after revoke)", after.accessToken);
			}

			// 5) OPTIONAL: Call protected endpoint as the SMART ACCOUNT: GET /me/k1-owner-state
			try {
				const url = `/me/k1-owner-state/${owner.address}`;
				const k1OwnerState = await getJSON<K1OwnerState[]>(url, {
					bearer: after.accessToken,
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
			}

			return; // done
		} catch (e) {
			lastErr = e; // try next chainId
		}
	}
	throw lastErr;
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
