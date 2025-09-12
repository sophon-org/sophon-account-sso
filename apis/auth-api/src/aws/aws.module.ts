import { Module } from "@nestjs/common";
import { SecretsService } from "./secrets.service";
import { JwtKeysService } from "./jwt-keys.service";

@Module({
	providers: [SecretsService, JwtKeysService],
	exports: [SecretsService, JwtKeysService],
})
export class AwsModule {}
