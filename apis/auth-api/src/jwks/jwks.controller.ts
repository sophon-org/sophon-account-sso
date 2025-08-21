import { createPublicKey } from "node:crypto";
import { Controller, Get } from "@nestjs/common";
import { getPublicKey } from "../utils/jwt"; // returns PEM string

@Controller("/.well-known")
export class JwksController {
	@Get("jwks.json")
	async getJwks() {
		try {
			const publicKeyPem = await getPublicKey();
			const keyObj = createPublicKey(publicKeyPem);
			// biome-ignore lint/suspicious/noExplicitAny: TODO: review this
			const exported = keyObj.export({ format: "jwk" }) as any;

			return {
				keys: [
					{
						...exported,
						alg: "RS256",
						use: "sig",
						kid: process.env.JWT_KID || "default-key",
					},
				],
			};
		} catch (err) {
			console.error("[JWKS] Failed to load public key:", err);
			return { keys: [] };
		}
	}
}
