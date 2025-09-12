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
import { sophon, sophonTestnet } from "viem/chains";

import { getEnv, getJwtKid } from "../config/env";
import {
	type PermissionAllowedField,
	packScope,
	unpackScope,
} from "../config/permission-allowed-fields";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { SessionsRepository } from "../sessions/sessions.repository";
import {
	getPrivateKey,
	getPublicKey,
	getRefreshPrivateKey,
	getRefreshPublicKey,
} from "../utils/jwt";
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

@Injectable()
export class AuthService {
	constructor(
		private readonly partnerRegistry: PartnerRegistryService,
		private readonly sessions: SessionsRepository,
	) {
		this.E = getEnv();
	}

	private readonly E: ReturnType<typeof getEnv>;

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
					issuer: this.E.NONCE_ISSUER,
					audience,
					subject: address,
					expiresIn: this.E.NONCE_TTL_S,
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
		const expectedIss = this.E.NONCE_ISSUER;

		let payload!: NoncePayload;
		try {
			payload = jwt.verify(nonceToken, await getPublicKey(), {
				algorithms: ["RS256"],
				audience: expectedAud,
				issuer: expectedIss,
			}) as NoncePayload;
		} catch (e) {
			console.error(e);
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

		const network = process.env.CHAIN_ID === "50104" ? sophon : sophonTestnet;

		const isValid = await verifyEIP1271Signature({
			accountAddress: address,
			signature,
			domain: {
				name: "Sophon SSO",
				version: "1",
				chainId: network.id,
			},
			types: typedData.types,
			primaryType: typedData.primaryType,
			message: typedData.message,
			chain: network,
		});

		if (!isValid) {
			throw new UnauthorizedException("signature is invalid");
		}
		const scope = packScope(unpackScope(payload.scope ?? ""));

		const iat = Math.floor(Date.now() / 1000);
		const expiresInSeconds = this.E.ACCESS_TTL_S;

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
					issuer: this.E.JWT_ISSUER,
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
	): Promise<{
		accessToken: string;
		accessTokenExpiresAt: number;
		refreshToken: string;
		refreshTokenExpiresAt: number;
		sid: string;
	}> {
		const expectedAud = String(typedData.message.audience);
		await this.partnerRegistry.assertExists(expectedAud);
		const expectedIss = this.E.NONCE_ISSUER;

		let payload!: NoncePayload;
		try {
			payload = jwt.verify(nonceToken, await getPublicKey(), {
				algorithms: ["RS256"],
				audience: expectedAud,
				issuer: expectedIss,
			}) as NoncePayload;
		} catch (e) {
			console.error(e);
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

		const network = process.env.CHAIN_ID === "50104" ? sophon : sophonTestnet;

		const isValid = await verifyEIP1271Signature({
			accountAddress: address,
			signature,
			domain: {
				name: "Sophon SSO",
				version: "1",
				chainId: network.id,
			},
			types: typedData.types,
			primaryType: typedData.primaryType,
			message: typedData.message,
			chain: network,
		});

		if (!isValid) {
			throw new UnauthorizedException("signature is invalid");
		}
		const scope = packScope(unpackScope(payload.scope ?? ""));

		const sid = randomUUID();
		const iat = Math.floor(Date.now() / 1000);
		const accessExp = this.E.ACCESS_TTL_S;
		const refreshExp = this.E.REFRESH_TTL_S;

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
				issuer: this.E.JWT_ISSUER,
				audience: payload.aud,
				expiresIn: accessExp,
			},
		);

		const refreshJti = randomUUID();
		const refreshToken = jwt.sign(
			{
				sub: address,
				iat,
				scope,
				userId: payload.userId,
				sid,
				jti: refreshJti,
				typ: "refresh",
			},
			await getRefreshPrivateKey(),
			{
				algorithm: "RS256",
				keyid: this.E.REFRESH_JWT_KID,
				issuer: this.E.REFRESH_ISSUER,
				audience: payload.aud,
				expiresIn: refreshExp,
			},
		);

		const decoded = jwt.decode(refreshToken) as { exp?: number } | null;
		await this.sessions.create({
			sid,
			userId: payload.userId ?? address,
			aud: payload.aud,
			currentRefreshJti: refreshJti,
			refreshExpiresAt:
				decoded?.exp != null
					? new Date(decoded.exp * 1000)
					: new Date(Date.now() + refreshExp * 1000),
		});

		return {
			accessToken,
			accessTokenExpiresAt: iat + accessExp,
			refreshToken,
			refreshTokenExpiresAt: iat + refreshExp,
			sid,
		};
	}

	cookieOptions() {
		return {
			httpOnly: true,
			secure: true,
			sameSite: "lax" as const,
			domain: this.E.COOKIE_DOMAIN,
			path: "/",
			maxAge: this.E.COOKIE_ACCESS_MAX_AGE_S * 1000,
		};
	}

	refreshCookieOptions() {
		return {
			httpOnly: true,
			secure: true,
			sameSite: "strict" as const,
			domain: this.E.COOKIE_DOMAIN,
			path: "/auth/refresh",
			maxAge: this.E.COOKIE_REFRESH_MAX_AGE_S * 1000,
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

		if (payload.iss !== this.E.JWT_ISSUER) {
			throw new UnauthorizedException("invalid token issuer");
		}

		await this.partnerRegistry.assertExists(payload.aud);
		const rowSid = (payload as AccessTokenPayload & { sid?: string }).sid;
		if (rowSid) {
			const row = await this.sessions.getBySid(rowSid);
			if (!this.sessions.isActive(row)) {
				throw new UnauthorizedException("session revoked or expired");
			}
			if (row.invalidateBefore) {
				const iatSec = payload.iat ?? 0;
				const cut = Math.floor(new Date(row.invalidateBefore).getTime() / 1000);
				if (iatSec < cut) {
					throw new UnauthorizedException(
						"access token is too old (invalidated)",
					);
				}
			}
		}
		return payload as AccessTokenPayload;
	}

	async revokeByRefreshToken(refreshToken: string): Promise<void> {
		let r!: RefreshTokenPayload;
		try {
			r = jwt.verify(refreshToken, await getRefreshPublicKey(), {
				algorithms: ["RS256"],
				issuer: this.E.REFRESH_ISSUER,
			}) as RefreshTokenPayload;
		} catch {
			return;
		}
		const rTyp = (r as RefreshTokenPayload & { typ?: string }).typ;
		if (rTyp && rTyp !== "refresh") {
			return;
		}
		await this.sessions.revokeSid(r.sid);
	}

	async refresh(refreshToken: string): Promise<{
		accessToken: string;
		accessTokenExpiresAt: number;
		refreshToken: string;
		refreshTokenExpiresAt: number;
	}> {
		let r!: RefreshTokenPayload;
		try {
			r = jwt.verify(refreshToken, await getRefreshPublicKey(), {
				algorithms: ["RS256"],
				issuer: this.E.REFRESH_ISSUER,
			}) as RefreshTokenPayload;
		} catch (e) {
			console.error(e);
			this.mapJwtError(e, "refresh");
		}

		const rTyp = (r as RefreshTokenPayload & { typ?: string }).typ;
		if (rTyp && rTyp !== "refresh") {
			throw new UnauthorizedException(`Invalid refresh token type: ${rTyp}`);
		}

		await this.partnerRegistry.assertExists(r.aud);

		const row = await this.sessions.getBySid(r.sid);
		if (!this.sessions.isActive(row)) {
			throw new UnauthorizedException("session revoked or expired");
		}

		if (row.currentRefreshJti !== r.jti) {
			await this.sessions.revokeSid(r.sid);
			throw new UnauthorizedException("refresh token reuse detected");
		}

		const iat = Math.floor(Date.now() / 1000);
		const accessExp = this.E.ACCESS_TTL_S;
		const refreshExp = this.E.REFRESH_TTL_S;

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
				issuer: this.E.JWT_ISSUER,
				audience: r.aud,
				expiresIn: accessExp,
			},
		);

		const newJti = randomUUID();

		const newRefresh = jwt.sign(
			{
				sub: r.sub,
				iat,
				scope: r.scope,
				userId: r.userId,
				sid: r.sid,
				jti: newJti,
				typ: "refresh",
			},
			await getRefreshPrivateKey(),
			{
				algorithm: "RS256",
				keyid: this.E.REFRESH_JWT_KID,
				issuer: this.E.REFRESH_ISSUER,
				audience: r.aud,
				expiresIn: refreshExp,
			},
		);

		const decoded = jwt.decode(newRefresh) as { exp?: number } | null;
		const newRefreshExpiresAt =
			decoded?.exp != null
				? new Date(decoded.exp * 1000)
				: new Date((iat + this.E.REFRESH_TTL_S) * 1000);

		await this.sessions.rotateRefreshJti({
			sid: r.sid,
			newJti,
			newRefreshExpiresAt,
		});

		return {
			accessToken: newAccess,
			accessTokenExpiresAt: iat + accessExp,
			refreshToken: newRefresh,
			refreshTokenExpiresAt: iat + refreshExp,
		};
	}
}
