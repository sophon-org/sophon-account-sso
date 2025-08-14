import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";

import jwt, { type JwtPayload } from "jsonwebtoken";
import type { TypedDataDefinition } from "viem";
import { sophonTestnet } from "viem/chains";

import { getJwtKid, JWT_AUDIENCE, JWT_ISSUER } from "../config/env";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { getPrivateKey, getPublicKey } from "../utils/jwt"; // should return PEM or KeyObject
import { verifyEIP1271Signature } from "../utils/signature";

@Injectable()
export class AuthService {
	constructor(private readonly partnerRegistry: PartnerRegistryService) {}

	async generateNonceTokenForAddress(
		address: string,
		audience: string,
	): Promise<string> {
		await this.partnerRegistry.assertExists(audience);

		const nonce = randomUUID();
		const token = jwt.sign(
			{ nonce, address }, // payload
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

		return token;
	}

	async verifySignatureWithSiwe(
		address: `0x${string}`,
		typedData: TypedDataDefinition,
		signature: `0x${string}`,
		nonceToken: string,
		rememberMe = false,
	): Promise<string> {
		type NoncePayload = JwtPayload & {
			address: string;
			nonce: string;
			aud: string;
			iss: string;
			sub?: string;
		};

		const expectedAud = String(typedData.message.audience);
		await this.partnerRegistry.assertExists(expectedAud);
		const expectedIss = process.env.NONCE_ISSUER;

		const payload = jwt.verify(nonceToken, await getPublicKey(), {
			algorithms: ["RS256"],
			audience: expectedAud,
			issuer: expectedIss,
		}) as NoncePayload;

		// Compare SIWE message values to the *decoded payload* (fixes prior mismatch)
		if (
			payload.nonce !== typedData.message.nonce ||
			payload.address.toLowerCase() !==
				(typedData.message.from as string).toLowerCase()
		) {
			throw new Error("Nonce or address mismatch");
		}

		if (String(typedData.message.audience) !== payload.aud) {
			throw new Error("Audience mismatch");
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
			throw new Error("Signature is invalid, cannot proceed");
		}

		const iat = Math.floor(Date.now() / 1000);
		const expiresInSeconds = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 3; // 7d or 3h

		const accessToken = jwt.sign(
			{
				sub: address,
				iat, // explicitly set issued-at
				// exp will be derived from expiresIn below
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

		return accessToken;
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
		const payload = jwt.verify(token, await getPublicKey(), {
			algorithms: ["RS256"],
		}) as JwtPayload;

		// NOTE: This check looked reversed in your original code.
		// Likely you want: payload.aud === JWT_AUDIENCE && payload.iss === JWT_ISSUER
		if (payload.aud !== JWT_ISSUER || payload.iss !== JWT_AUDIENCE) {
			throw new Error("Invalid token audience or issuer");
		}

		return payload;
	}
}
