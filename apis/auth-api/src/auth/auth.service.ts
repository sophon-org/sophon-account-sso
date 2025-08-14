import { randomUUID } from "node:crypto";
import {
	Injectable,
	UnauthorizedException,
	BadRequestException,
	ForbiddenException,
} from "@nestjs/common";

import jwt, {
	type JwtPayload,
	TokenExpiredError,
	NotBeforeError,
	JsonWebTokenError,
} from "jsonwebtoken";
import type { TypedDataDefinition } from "viem";
import { sophonTestnet } from "viem/chains";

import { getJwtKid, JWT_AUDIENCE, JWT_ISSUER } from "../config/env";
import {
	packScope,
	unpackScope,
	type PermissionAllowedField,
} from "../config/permission-allowed-fields";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { getPrivateKey, getPublicKey } from "../utils/jwt";
import { verifyEIP1271Signature } from "../utils/signature";

type NoncePayload = JwtPayload & {
	address: string;
	nonce: string;
	aud: string;
	iss: string;
	scope?: string;
	sub?: string;
};

@Injectable()
export class AuthService {
	constructor(private readonly partnerRegistry: PartnerRegistryService) {}

	private mapJwtError(e: unknown, ctx: "nonce" | "access"): never {
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
	): Promise<string> {
		await this.partnerRegistry.assertExists(audience);

		try {
			const nonce = randomUUID();
			return jwt.sign(
				{
					nonce,
					address,
					scope: packScope(fields),
				},
				await getPrivateKey(),
				{
					algorithm: "RS256",
					keyid: getJwtKid(),
					issuer: JWT_ISSUER,
					audience,
					subject: address,
					expiresIn: "10m",
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
		rememberMe = false,
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
			payload.nonce !== typedData.message.nonce ||
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
		const expiresInSeconds = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 3;

		try {
			return jwt.sign(
				{
					sub: address,
					iat,
					scope,
				},
				await getPrivateKey(),
				{
					algorithm: "RS256",
					keyid: getJwtKid(),
					issuer: payload.iss,
					audience: payload.aud,
					subject: address,
					expiresIn: expiresInSeconds,
				},
			);
		} catch (e) {
			throw new BadRequestException(
				e instanceof Error ? e.message : "failed to sign access token",
			);
		}
	}

	cookieOptions(rememberMe = false) {
		return {
			httpOnly: true,
			secure: true,
			sameSite: "none" as const,
			domain: process.env.COOKIE_DOMAIN || "localhost",
			maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 3, // 7d or 3h
		};
	}

	async verifyAccessToken(token: string): Promise<JwtPayload> {
		let payload!: JwtPayload;
		try {
			payload = jwt.verify(token, await getPublicKey(), {
				algorithms: ["RS256"],
			}) as JwtPayload;
		} catch (e) {
			this.mapJwtError(e, "access");
		}

		if (payload.aud !== JWT_AUDIENCE || payload.iss !== JWT_ISSUER) {
			throw new UnauthorizedException("invalid token audience or issuer");
		}

		return payload;
	}
}
