import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SecretsService } from "./secrets.service";

@Module({
	imports: [ConfigModule], // if SecretsService reads env/config
	providers: [SecretsService],
	exports: [SecretsService],
})
export class SecretsModule {}
