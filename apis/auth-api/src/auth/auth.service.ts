import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import type { TypedDataDefinition } from "viem";
import { sophonTestnet } from "viem/chains";
import { getJwtKid, JWT_AUDIENCE, JWT_ISSUER } from "../config/env.js";
import { getPrivateKey, getPublicKey } from "../utils/jwt.js";
import { verifyEIP1271Signature } from "../utils/signature.js";

@Injectable()
export class AuthService {
	async generateNonceTokenForAddress(address: string): Promise<string> {
		const nonce = randomUUID();
		return await new SignJWT({ nonce, address })
			.setProtectedHeader({ alg: "RS256", kid: getJwtKid() })
			.setIssuedAt()
			.setExpirationTime("10m") // TODO here
			.sign(await getPrivateKey());
	}

	async verifySignatureWithSiwe(
		address: `0x${string}`,
		typedData: TypedDataDefinition,
		signature: `0x${string}`,
		nonceToken: string,
		rememberMe = false,
	): Promise<string> {
		const { payload } = (await jwtVerify(nonceToken, getPublicKey, {
			algorithms: ["RS256"],
		})) as {
			payload: { address: string; nonce: string };
		};

		if (
			nonceToken !== typedData.message.nonce ||
			payload.address.toLowerCase() !==
				(typedData.message.from as string).toLowerCase()
		) {
			throw new Error("Nonce or address mismatch");
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
		// ideally, user should have a 'remember me' checkbox, if set, then  1 week is ok, maybe more. If not set, then 3 hours?
		const exp = iat + (rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 3); // 7d or 3h

		return await new SignJWT({
			sub: address,
			iat,
			exp,
			iss: JWT_AUDIENCE,
			aud: JWT_ISSUER,
		})
			.setProtectedHeader({ alg: "RS256", kid: getJwtKid() })
			.sign(await getPrivateKey());
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

	async verifyAccessToken(token: string): Promise<JWTPayload> {
		const { payload } = await jwtVerify(token, await getPublicKey(), {
			algorithms: ["RS256"],
		});

		if (payload.aud !== JWT_ISSUER || payload.iss !== JWT_AUDIENCE) {
			throw new Error("Invalid token audience or issuer");
		}

		return payload as JWTPayload;
	}
}
