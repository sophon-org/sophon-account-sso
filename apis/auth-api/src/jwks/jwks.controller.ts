import { createPublicKey } from "node:crypto";
import { Controller, Get, Header } from "@nestjs/common";
import { JwtKeysService } from "../aws/jwt-keys.service";

@Controller("/.well-known")
export class JwksController {
	constructor(private readonly keys: JwtKeysService) {}

	@Get("jwks.json")
	@Header("Cache-Control", "public, max-age=300, must-revalidate")
	async getJwks() {
		try {
			const [publicKeyPem, kid] = await Promise.all([
				this.keys.getAccessPublicKey(),
				this.keys.getAccessKid(),
			]);
			const jwk = createPublicKey(publicKeyPem).export({
				format: "jwk",
			}) as JsonWebKey;

			return {
				keys: [
					{
						...jwk,
						alg: "RS256",
						use: "sig",
						kid,
					},
				],
			};
		} catch {
			return { keys: [] };
		}
	}
}
