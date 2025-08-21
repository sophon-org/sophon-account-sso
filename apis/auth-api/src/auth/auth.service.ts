// auth.service.ts
import { randomUUID } from "node:crypto";
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";

import jwt, {
	JsonWebTokenError,
	type JwtPayload,
	NotBeforeError,
	TokenExpiredError,
} from "jsonwebtoken";
import type { TypedDataDefinition } from "viem";
import { sophonTestnet } from "viem/chains";

import { getJwtKid, JWT_ISSUER } from "../config/env";
import {
	type PermissionAllowedField,
	packScope,
	unpackScope,
} from "../config/permission-allowed-fields";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { getPrivateKey, getPublicKey, getRefreshPrivateKey, getRefreshPublicKey } from "../utils/jwt";
import { verifyEIP1271Signature } from "../utils/signature";
import type { AccessTokenPayload, RefreshTokenPayload } from "./types";

type NoncePayload = JwtPayload & {
	address: string;
	nonce: string;
	aud: string;
	iss: string;
	scope?: string;
	sub?: string;
	userId?: string;
};

const ACCESS_TTL_S = Number(process.env.ACCESS_TTL_S ?? 60 * 60 * 3);
const REFRESH_TTL_S = Number(process.env.REFRESH_TTL_S ?? 60 * 60 * 24 * 30);
const NONCE_TTL_S = Number(process.env.NONCE_TTL_S ?? 60 * 10);
const COOKIE_ACCESS_MAX_AGE_S = Number(process.env.COOKIE_ACCESS_MAX_AGE_S ?? ACCESS_TTL_S);
const COOKIE_REFRESH_MAX_AGE_S = Number(process.env.COOKIE_REFRESH_MAX_AGE_S ?? REFRESH_TTL_S);

@Injectable()
export class AuthService {
	constructor(private readonly partnerRegistry: PartnerRegistryService) {}

	private mapJwtError(e: unknown, ctx: "nonce" | "access" | "refresh"): never {
		if (e instanceof TokenExpiredError) {
			throw new UnauthorizedException(`${ctx} token expired`);
		}
		if (e instanceof NotBeforeError) {
			throw new UnauthorizedException(`${ctx} token not active yet`);
		}
		if (e instanceof JsonWebTokenError) {
			throw new UnauthorizedException(`invalid ${ctx} token`);
		}
		throw new BadRequestException(
			e instanceof Error ? e.message : `invalid ${ctx} token`,
		);
	}

	async generateNonceTokenForAddress(
		address: string,
		audience: string,
		fields: PermissionAllowedField[],
		userId?: string,
	): Promise<string> {
		await this.partnerRegistry.assertExists(audience);

		try {
			const nonce = randomUUID();
			return jwt.sign(
				{
					nonce,
					address,
					scope: packScope(fields),
					...(userId?.trim() ? { userId: userId.trim() } : {}),
				},
				await getPrivateKey(),
				{
					algorithm: "RS256",
					keyid: getJwtKid(),
					issuer: JWT_ISSUER,
					audience,
					subject: address,
					expiresIn: NONCE_TTL_S,
				},
			);
		} catch (e) {
			throw new BadRequestException(
				e instanceof Error ? e.message : "failed to sign nonce token",
			);
		}
	}

	async verifySignatureWithSiwe(
		address: `0x${string}`,
		typedData: TypedDataDefinition,
		signature: `0x${string}`,
		nonceToken: string,
	): Promise<string> {
		const expectedAud = String(typedData.message.audience);
		await this.partnerRegistry.assertExists(expectedAud);
		const expectedIss = process.env.NONCE_ISSUER;

		let payload!: NoncePayload;
		try {
			payload = jwt.verify(nonceToken, await getPublicKey(), {
				algorithms: ["RS256"],
				audience: expectedAud,
				issuer: expectedIss,
			}) as NoncePayload;
		} catch (e) {
			this.mapJwtError(e, "nonce");
		}

		if (
			nonceToken !== typedData.message.nonce ||
			payload.address.toLowerCase() !==
				(typedData.message.from as string).toLowerCase()
		) {
			throw new UnauthorizedException("Nonce or address mismatch");
		}

		if (String(typedData.message.audience) !== payload.aud) {
			throw new ForbiddenException("audience mismatch");
		}

		const isValid = await verifyEIP1271Signature({
			accountAddress: address,
			signature,
			domain: {
				name: "Sophon SSO",
				version: "1",
				chainId: sophonTestnet.id,
			},
			types: typedData.types,
			primaryType: typedData.primaryType,
			message: typedData.message,
			chain: sophonTestnet,
		});

		if (!isValid) {
			throw new UnauthorizedException("signature is invalid");
		}
		const scope = packScope(unpackScope(payload.scope ?? ""));

		const iat = Math.floor(Date.now() / 1000);
		const expiresInSeconds = ACCESS_TTL_S;

		try {
			return jwt.sign(
				{
					sub: address,
					iat,
					scope,
					userId: payload.userId,
				},
				await getPrivateKey(),
				{
					algorithm: "RS256",
					keyid: getJwtKid(),
					issuer: payload.iss,
					audience: payload.aud,
					expiresIn: expiresInSeconds,
				},
			);
		} catch (e) {
			throw new BadRequestException(
				e instanceof Error ? e.message : "failed to sign access token",
			);
		}
	}

	async verifySignatureWithSiweIssueTokens(
		address: `0x${string}`,
		typedData: TypedDataDefinition,
		signature: `0x${string}`,
		nonceToken: string,
	): Promise<{ accessToken: string; refreshToken: string; sid: string }> {
		const expectedAud = String(typedData.message.audience);
		await this.partnerRegistry.assertExists(expectedAud);
		const expectedIss = process.env.NONCE_ISSUER;

		let payload!: NoncePayload;
		try {
			payload = jwt.verify(nonceToken, await getPublicKey(), {
				algorithms: ["RS256"],
				audience: expectedAud,
				issuer: expectedIss,
			}) as NoncePayload;
		} catch (e) {
			this.mapJwtError(e, "nonce");
		}

		if (
			nonceToken !== typedData.message.nonce ||
			payload.address.toLowerCase() !==
				(typedData.message.from as string).toLowerCase()
		) {
			throw new UnauthorizedException("Nonce or address mismatch");
		}

		if (String(typedData.message.audience) !== payload.aud) {
			throw new ForbiddenException("audience mismatch");
		}

		const isValid = await verifyEIP1271Signature({
			accountAddress: address,
			signature,
			domain: {
				name: "Sophon SSO",
				version: "1",
				chainId: sophonTestnet.id,
			},
			types: typedData.types,
			primaryType: typedData.primaryType,
			message: typedData.message,
			chain: sophonTestnet,
		});

		if (!isValid) {
			throw new UnauthorizedException("signature is invalid");
		}
		const scope = packScope(unpackScope(payload.scope ?? ""));

		const sid = randomUUID();
		const iat = Math.floor(Date.now() / 1000);
		const accessExp = ACCESS_TTL_S;
		const refreshExp = REFRESH_TTL_S;

		const accessToken = jwt.sign(
			{
				sub: address,
				iat,
				scope,
				userId: payload.userId,
				sid,
				typ: "access",
			},
			await getPrivateKey(),
			{
				algorithm: "RS256",
				keyid: getJwtKid(),
				issuer: payload.iss,
				audience: payload.aud,
				expiresIn: accessExp,
			},
		);

		const refreshToken = jwt.sign(
			{
				sub: address,
				iat,
				scope,
				userId: payload.userId,
				sid,
				jti: randomUUID(),
				typ: "refresh",
			},
			await getRefreshPrivateKey(),
			{
				algorithm: "RS256",
				keyid: process.env.REFRESH_JWT_KID ?? "refresh-key-1",
				issuer: process.env.REFRESH_ISSUER ?? JWT_ISSUER,
				audience: payload.aud,
				expiresIn: refreshExp,
			},
		);

		return { accessToken, refreshToken, sid };
	}

	cookieOptions() {
		return {
			httpOnly: true,
			secure: true,
			sameSite: "none" as const,
			domain: process.env.COOKIE_DOMAIN || "localhost",
			maxAge: COOKIE_ACCESS_MAX_AGE_S,
		};
	}

	refreshCookieOptions() {
		return {
			httpOnly: true,
			secure: true,
			sameSite: "none" as const,
			domain: process.env.COOKIE_DOMAIN || "localhost",
			maxAge: COOKIE_REFRESH_MAX_AGE_S,
		};
	}

	async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
		let payload!: AccessTokenPayload;
		try {
			payload = jwt.verify(token, await getPublicKey(), {
				algorithms: ["RS256"],
			}) as AccessTokenPayload;
		} catch (e) {
			this.mapJwtError(e, "access");
		}

		if (payload.iss !== JWT_ISSUER) {
			throw new UnauthorizedException("invalid token issuer");
		}

		await this.partnerRegistry.assertExists(payload.aud);

		return payload as AccessTokenPayload;
	}

	async refresh(
		refreshToken: string,
	): Promise<{ accessToken: string; refreshToken: string }> {
		let r!: RefreshTokenPayload;
		try {
			r = jwt.verify(refreshToken, await getRefreshPublicKey(), {
				algorithms: ["RS256"],
				issuer: process.env.REFRESH_ISSUER ?? JWT_ISSUER,
			}) as RefreshTokenPayload;
		} catch (e) {
			this.mapJwtError(e, "refresh");
		}

		await this.partnerRegistry.assertExists(r.aud);

		const iat = Math.floor(Date.now() / 1000);

		const newAccess = jwt.sign(
			{
				sub: r.sub,
				iat,
				scope: r.scope,
				userId: r.userId,
				sid: r.sid,
				typ: "access",
			},
			await getPrivateKey(),
			{
				algorithm: "RS256",
				keyid: getJwtKid(),
				issuer: JWT_ISSUER,
				audience: r.aud,
				expiresIn: ACCESS_TTL_S,
			},
		);

		const newRefresh = jwt.sign(
			{
				sub: r.sub,
				iat,
				scope: r.scope,
				userId: r.userId,
				sid: r.sid,
				jti: randomUUID(),
				typ: "refresh",
			},
			await getRefreshPrivateKey(),
			{
				algorithm: "RS256",
				keyid: process.env.REFRESH_JWT_KID ?? "refresh-key-1",
				issuer: process.env.REFRESH_ISSUER ?? JWT_ISSUER,
				audience: r.aud,
				expiresIn: REFRESH_TTL_S,
			},
		);

		return { accessToken: newAccess, refreshToken: newRefresh };
	}
}
