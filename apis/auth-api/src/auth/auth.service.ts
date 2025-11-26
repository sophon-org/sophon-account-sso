import { randomUUID } from "node:crypto";
import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { parseChainId, SophonChains } from "@sophon-labs/account-core";
import jwt, {
	JsonWebTokenError,
	type JwtPayload,
	NotBeforeError,
	TokenExpiredError,
} from "jsonwebtoken";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { toConsentClaims } from "src/consents/consent-claims.util";
import { ConsentsService } from "src/consents/consents.service";
import { Address, type TypedDataDefinition, verifyTypedData } from "viem";
import { JwtKeysService } from "../aws/jwt-keys.service";
import { authConfig } from "../config/auth.config";
import {
	type PermissionAllowedField,
	packScope,
	unpackScope,
} from "../config/permission-allowed-fields";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { SessionsRepository } from "../sessions/sessions.repository";
import { verifyEIP1271Signature } from "../utils/signature";
import type { AccessTokenPayload, RefreshTokenPayload } from "./types";

type NoncePayload = JwtPayload & {
	address: string;
	nonce: string;
	aud: string;
	iss: string;
	scope?: string;
	sub: string;
	userId?: string;
};

type ClientInfo = { ip?: string | null; userAgent?: string | null };

@Injectable()
export class AuthService {
	constructor(
		private readonly partnerRegistry: PartnerRegistryService,
		private readonly sessions: SessionsRepository,
		private readonly keys: JwtKeysService,
		@Inject(authConfig.KEY)
		private readonly auth: ConfigType<typeof authConfig>,
		@InjectPinoLogger(AuthService.name)
		private readonly logger: PinoLogger,
		private readonly consents: ConsentsService,
	) {}

	private mapJwtError(e: unknown, ctx: "nonce" | "access" | "refresh"): never {
		const name =
			e instanceof Error ? e.name : typeof e === "string" ? e : "UnknownError";
		this.logger.info(
			{ evt: "jwt.verify.failed", ctx, errName: name },
			"jwt verify failed",
		);
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
			const token = jwt.sign(
				{
					nonce,
					address,
					scope: packScope(fields),
					...(userId?.trim() ? { userId: userId.trim() } : {}),
				},
				await this.keys.getAccessPrivateKey(),
				{
					algorithm: "RS256",
					keyid: await this.keys.getAccessKid(),
					issuer: this.auth.nonceIssuer,
					audience,
					subject: address,
					expiresIn: this.auth.nonceTtlS,
				},
			);
			this.logger.info(
				{ evt: "auth.nonce.issued", address, audience },
				"nonce issued",
			);
			return token;
		} catch (e) {
			this.logger.error(
				{ evt: "auth.nonce.error", address, audience, err: e },
				"nonce sign failed",
			);
			throw new BadRequestException(
				e instanceof Error ? e.message : "failed to sign nonce token",
			);
		}
	}

	async verifySignatureWithSiweIssueTokens(
		address: `0x${string}`,
		typedData: TypedDataDefinition,
		signature: `0x${string}`,
		nonceToken: string,
		client?: ClientInfo,
		ownerAddress?: Address,
		audience?: string,
		contentsHash?: string,
	): Promise<{
		accessToken: string;
		accessTokenExpiresAt: number;
		refreshToken: string;
		refreshTokenExpiresAt: number;
		sid: string;
	}> {
		const expectedAud = audience || String(typedData.message.audience);
		await this.partnerRegistry.assertExists(expectedAud);
		const expectedIss = this.auth.nonceIssuer;

		let payload!: NoncePayload;
		try {
			payload = jwt.verify(nonceToken, await this.keys.getAccessPublicKey(), {
				algorithms: ["RS256"],
				audience: expectedAud,
				issuer: expectedIss,
			}) as NoncePayload;
		} catch (e) {
			this.mapJwtError(e, "nonce");
		}

		// For Biconomy flow, we verify that the client-provided audience
		// matches the nonce JWT's audience claim to prevent tampering.
		// The nonce JWT is cryptographically signed and contains the true audience.
		if (audience && audience !== payload.aud) {
			this.logger.warn(
				{
					evt: "auth.verify.aud_tampering_attempt",
					claimed: audience,
					actual: payload.aud,
					address,
				},
				"audience parameter doesn't match nonce JWT",
			);
			throw new ForbiddenException("audience mismatch with nonce");
		}

		// For Biconomy flow (when audience is explicitly passed), skip message field checks
		// as the message only contains a hash. For zkSync flow, validate message fields.
		if (!audience) {
			if (
				nonceToken !== typedData.message.nonce ||
				payload.address.toLowerCase() !==
					(typedData.message.from as string).toLowerCase()
			) {
				this.logger.info(
					{ evt: "auth.verify.mismatch", address, aud: expectedAud },
					"nonce or address mismatch",
				);
				throw new UnauthorizedException("Nonce or address mismatch");
			}

			if (String(typedData.message.audience) !== payload.aud) {
				this.logger.info(
					{ evt: "auth.verify.aud_mismatch", expected: payload.aud },
					"audience mismatch",
				);
				throw new ForbiddenException("audience mismatch");
			}
		}

		const network = SophonChains[parseChainId(process.env.CHAIN_ID)];

		let isValid = false;
		// with the new blockchain comming, for now, if we receive an owner address,
		// it means that we don't have the contract deployed already, so we need to verify
		// the signature with the owner address
		// TODO: when we have the new blockchain ready, we need to remove this logic and use the EIP-1271 signature verification
		if (ownerAddress) {
			isValid = await verifyTypedData({
				address: ownerAddress,
				primaryType: typedData.primaryType,
				types: typedData.types,
				domain: typedData.domain,
				message: typedData.message,
				signature,
			});
		} else {
			isValid = await verifyEIP1271Signature({
				accountAddress: address,
				signature,
				domain: { name: "Sophon SSO", version: "1", chainId: network.id },
				types: typedData.types,
				primaryType: typedData.primaryType,
				message: typedData.message,
				chain: network,
				logger: this.logger,
				contentsHash,
			});
		}

		if (!isValid) {
			this.logger.info(
				{ evt: "auth.verify.invalid_sig", address },
				"invalid signature",
			);
			throw new UnauthorizedException("signature is invalid");
		}

		const scope = packScope(unpackScope(payload.scope ?? ""));
		const sid = randomUUID();
		const iat = Math.floor(Date.now() / 1000);
		const accessExp = this.auth.accessTtlS;
		const refreshExp = this.auth.refreshTtlS;

		const active = await this.consents.getActiveConsents(
			payload.address.toLowerCase(),
		);
		const c = toConsentClaims(active);

		const accessToken = jwt.sign(
			{
				sub: address.toLowerCase(),
				iat,
				scope,
				userId: payload.userId,
				sid,
				typ: "access",
				c,
			},
			await this.keys.getAccessPrivateKey(),
			{
				algorithm: "RS256",
				keyid: await this.keys.getAccessKid(),
				issuer: this.auth.jwtIssuer,
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
			await this.keys.getRefreshPrivateKey(),
			{
				algorithm: "RS256",
				keyid: await this.keys.getRefreshKid(),
				issuer: this.auth.refreshIssuer,
				audience: payload.aud,
				expiresIn: refreshExp,
			},
		);

		const decoded = jwt.decode(refreshToken) as { exp?: number } | null;
		await this.sessions.create({
			sid,
			userId: payload.userId ?? address,
			sub: address.toLowerCase(),
			aud: payload.aud,
			currentRefreshJti: refreshJti,
			refreshExpiresAt:
				decoded?.exp != null
					? new Date(decoded.exp * 1000)
					: new Date(Date.now() + refreshExp * 1000),
			createdIp: client?.ip ?? null,
			createdUserAgent: client?.userAgent ?? null,
		});

		this.logger.info(
			{
				evt: "auth.tokens.issued",
				sid,
				aud: payload.aud,
				accessExpInS: accessExp,
				refreshExpInS: refreshExp,
			},
			"tokens issued",
		);

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
			domain: this.auth.cookieDomain ?? undefined,
			path: "/",
			maxAge: this.auth.cookieAccessMaxAgeS * 1000,
		};
	}

	refreshCookieOptions() {
		return {
			httpOnly: true,
			secure: true,
			sameSite: "strict" as const,
			domain: this.auth.cookieDomain ?? undefined,
			path: "/auth/refresh",
			maxAge: this.auth.cookieRefreshMaxAgeS * 1000,
		};
	}

	async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
		let payload!: AccessTokenPayload;
		try {
			payload = jwt.verify(token, await this.keys.getAccessPublicKey(), {
				algorithms: ["RS256"],
			}) as AccessTokenPayload;
		} catch (e) {
			this.mapJwtError(e, "access");
		}

		if (payload.iss !== this.auth.jwtIssuer) {
			this.logger.info(
				{ evt: "auth.access.iss_mismatch", iss: payload.iss },
				"issuer mismatch",
			);
			throw new UnauthorizedException("invalid token issuer");
		}

		await this.partnerRegistry.assertExists(payload.aud);
		const rowSid = (payload as AccessTokenPayload & { sid?: string }).sid;
		if (rowSid) {
			const row = await this.sessions.getBySid(rowSid);
			if (!this.sessions.isActive(row)) {
				this.logger.info(
					{ evt: "auth.access.session_inactive", sid: rowSid },
					"inactive session",
				);
				throw new UnauthorizedException("session revoked or expired");
			}
			if (row.invalidateBefore) {
				const iatSec = payload.iat ?? 0;
				const cut = Math.floor(new Date(row.invalidateBefore).getTime() / 1000);
				if (iatSec < cut) {
					this.logger.info(
						{ evt: "auth.access.token_invalidated", sid: rowSid },
						"token invalidated by cutoff",
					);
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
			r = jwt.verify(refreshToken, await this.keys.getRefreshPublicKey(), {
				algorithms: ["RS256"],
				issuer: this.auth.refreshIssuer,
			}) as RefreshTokenPayload;
		} catch {
			return;
		}
		const rTyp = (r as RefreshTokenPayload & { typ?: string }).typ;
		if (rTyp && rTyp !== "refresh") {
			return;
		}
		await this.sessions.revokeSid(r.sid);
		this.logger.info(
			{ evt: "auth.sessions.revoke_by_rt", sid: r.sid },
			"session revoked by refresh token",
		);
	}

	async refresh(
		refreshToken: string,
		client?: ClientInfo,
	): Promise<{
		accessToken: string;
		accessTokenExpiresAt: number;
		refreshToken: string;
		refreshTokenExpiresAt: number;
	}> {
		let r!: RefreshTokenPayload;
		try {
			r = jwt.verify(refreshToken, await this.keys.getRefreshPublicKey(), {
				algorithms: ["RS256"],
				issuer: this.auth.refreshIssuer,
			}) as RefreshTokenPayload;
		} catch (e) {
			this.mapJwtError(e, "refresh");
		}

		const rTyp = (r as RefreshTokenPayload & { typ?: string }).typ;
		if (rTyp && rTyp !== "refresh") {
			this.logger.info(
				{ evt: "auth.refresh.bad_type", typ: rTyp },
				"invalid refresh token type",
			);
			throw new UnauthorizedException(`Invalid refresh token type: ${rTyp}`);
		}

		await this.partnerRegistry.assertExists(r.aud);

		const row = await this.sessions.getBySid(r.sid);
		if (!this.sessions.isActive(row)) {
			this.logger.info(
				{ evt: "auth.refresh.session_inactive", sid: r.sid },
				"inactive session",
			);
			throw new UnauthorizedException("session revoked or expired");
		}

		if (row.currentRefreshJti !== r.jti) {
			await this.sessions.revokeSid(r.sid);
			this.logger.warn(
				{ evt: "auth.refresh.reuse_detected", sid: r.sid },
				"refresh token reuse detected",
			);
			throw new UnauthorizedException("refresh token reuse detected");
		}

		const iat = Math.floor(Date.now() / 1000);
		const accessExp = this.auth.accessTtlS;
		const refreshExp = this.auth.refreshTtlS;

		const active = await this.consents.getActiveConsents(r.sub);
		const c = toConsentClaims(active);

		const newAccess = jwt.sign(
			{
				sub: r.sub,
				iat,
				scope: r.scope,
				userId: r.userId,
				sid: r.sid,
				typ: "access",
				c,
			},
			await this.keys.getAccessPrivateKey(),
			{
				algorithm: "RS256",
				keyid: await this.keys.getAccessKid(),
				issuer: this.auth.jwtIssuer,
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
			await this.keys.getRefreshPrivateKey(),
			{
				algorithm: "RS256",
				keyid: await this.keys.getRefreshKid(),
				issuer: this.auth.refreshIssuer,
				audience: r.aud,
				expiresIn: refreshExp,
			},
		);

		const decoded = jwt.decode(newRefresh) as { exp?: number } | null;
		const newRefreshExpiresAt =
			decoded?.exp != null
				? new Date(decoded.exp * 1000)
				: new Date((iat + this.auth.refreshTtlS) * 1000);

		await this.sessions.rotateRefreshJti({
			sid: r.sid,
			newJti,
			newRefreshExpiresAt,
			...(client
				? {
						ip: client.ip ?? null,
						userAgent: client.userAgent ?? null,
						ts: new Date(),
					}
				: {}),
		});

		this.logger.info(
			{
				evt: "auth.refresh.rotated",
				sid: r.sid,
				accessExpInS: accessExp,
				refreshExpInS: refreshExp,
			},
			"refresh rotated",
		);

		return {
			accessToken: newAccess,
			accessTokenExpiresAt: iat + accessExp,
			refreshToken: newRefresh,
			refreshTokenExpiresAt: iat + refreshExp,
		};
	}

	async listActiveSessionsForSub(sub: string, aud?: string) {
		const list = await this.sessions.findActiveForSub(sub);
		return aud ? list.filter((s) => s.aud === aud) : list;
	}

	async revokeSessionForSub(sub: string, sid: string): Promise<void> {
		const row = await this.sessions.getBySid(sid);
		if (!row) throw new NotFoundException("session not found");
		if (row.sub !== sub.toLowerCase())
			throw new ForbiddenException("forbidden");
		await this.sessions.revokeSid(sid);
		this.logger.info(
			{ evt: "auth.sessions.revoke", sid, sub },
			"session revoked",
		);
	}
}
