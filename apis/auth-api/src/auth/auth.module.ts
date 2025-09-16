// src/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtKeysModule } from "../aws/jwt-keys.module"; // your keys module
import { authConfig } from "../config/auth.config";
import { PartnerRegistryService } from "../partners/partner-registry.service";
import { Session } from "../sessions/session.entity";
import { SessionsRepository } from "../sessions/sessions.repository";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MeService } from "./me.service";

@Module({
	imports: [
		ConfigModule.forFeature(authConfig),
		TypeOrmModule.forFeature([Session]),
		JwtKeysModule,
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		SessionsRepository,
		PartnerRegistryService,
		MeService,
	],
	exports: [AuthService],
})
export class AuthModule {}
