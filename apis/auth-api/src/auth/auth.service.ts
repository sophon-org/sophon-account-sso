import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import type { TypedDataDefinition } from "viem";
import { sophonTestnet } from "viem/chains";
import { getJwtKid, JWT_AUDIENCE, JWT_ISSUER } from "../config/env";
import { getPrivateKey, getPublicKey } from "../utils/jwt";
import { verifyEIP1271Signature } from "../utils/signature";
import { assertAllowedAudience } from "../config/audience";

@Injectable()
export class AuthService {
	async generateNonceTokenForAddress(address: string, audience: string): Promise<string> {

		assertAllowedAudience(audience);
		const nonce = randomUUID();
		return await new SignJWT({ nonce, address })
			.setProtectedHeader({ alg: "RS256", kid: getJwtKid() })
			.setIssuedAt()
			.setSubject(address)
			.setIssuer(JWT_ISSUER)  
			.setAudience(audience)
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

		type NoncePayload = JWTPayload & {
			address: string;
			nonce: string;
			aud: string;
			iss: string; 
			sub?: string;
		};

		const expectedAud = String(typedData.message.audience);
		assertAllowedAudience(expectedAud);
		const expectedIss = process.env.NONCE_ISSUER;

		const { payload } = await jwtVerify<NoncePayload>(
			nonceToken,
			await getPublicKey(),
			{
			algorithms: ["RS256"],
			audience: expectedAud,
			issuer: expectedIss,
			}
		);

		if (
			nonceToken !== typedData.message.nonce ||
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
		// ideally, user should have a 'remember me' checkbox, if set, then  1 week is ok, maybe more. If not set, then 3 hours?
		const exp = iat + (rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 3); // 7d or 3h

		return await new SignJWT({
			sub: address,
			iat,
			exp,
			iss: payload.iss,
			aud: payload.aud,
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
