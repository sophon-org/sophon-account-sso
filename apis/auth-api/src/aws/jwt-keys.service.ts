import { Injectable } from "@nestjs/common";
import { SecretsService } from "./secrets.service";

@Injectable()
export class JwtKeysService {
	constructor(private readonly secrets: SecretsService) {}

	async getAccessPrivateKey(): Promise<string> {
		const s = await this.secrets.loadJwtSecrets();
		return s.access.privateKeyPem;
	}
	async getAccessPublicKey(): Promise<string> {
		const s = await this.secrets.loadJwtSecrets();
		return s.access.publicKeyPem;
	}
	async getAccessKid(): Promise<string> {
		const s = await this.secrets.loadJwtSecrets();
		return s.access.kid;
	}

	async getRefreshPrivateKey(): Promise<string> {
		const s = await this.secrets.loadJwtSecrets();
		return s.refresh.privateKeyPem;
	}
	async getRefreshPublicKey(): Promise<string> {
		const s = await this.secrets.loadJwtSecrets();
		return s.refresh.publicKeyPem;
	}
	async getRefreshKid(): Promise<string> {
		const s = await this.secrets.loadJwtSecrets();
		return s.refresh.kid;
	}

	async getDatabaseUrl(): Promise<string | undefined> {
		const s = await this.secrets.loadJwtSecrets();
		return s.databaseUrl;
	}
}
