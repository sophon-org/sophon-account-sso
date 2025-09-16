import { Module } from "@nestjs/common";
import { JwtKeysService } from "./jwt-keys.service";
import { SecretsService } from "./secrets.service";

@Module({
	providers: [SecretsService, JwtKeysService],
	exports: [SecretsService, JwtKeysService],
})
export class AwsModule {}
