import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtKeysService } from "./jwt-keys.service";
import { SecretsModule } from "./secrets.module";

@Module({
	imports: [ConfigModule, SecretsModule],
	providers: [JwtKeysService],
	exports: [JwtKeysService],
})
export class JwtKeysModule {}
