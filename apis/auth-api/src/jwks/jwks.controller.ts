import { createPublicKey } from "node:crypto";
import { Controller, Get, Header } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { JwtKeysService } from "../aws/jwt-keys.service";

@Controller("/.well-known")
export class JwksController {
	constructor(
		private readonly keys: JwtKeysService,
		@InjectPinoLogger(JwksController.name)
		private readonly logger: PinoLogger,
	) {}

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

			this.logger.info({ kid, kty: jwk.kty }, "JWKS served");

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
		} catch (err) {
			this.logger.error({ err }, "Failed to serve JWKS");
			return { keys: [] };
		}
	}
}
