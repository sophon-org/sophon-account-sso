// src/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { authConfig } from "../config/auth.config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

import { SessionsRepository } from "../sessions/sessions.repository";
import { Session } from "../sessions/session.entity";

import { PartnerRegistryService } from "../partners/partner-registry.service";
import { JwtKeysModule } from "../aws/jwt-keys.module"; // your keys module

@Module({
	imports: [
		ConfigModule.forFeature(authConfig),
		TypeOrmModule.forFeature([Session]),
		JwtKeysModule,
	],
	controllers: [AuthController],
	providers: [AuthService, SessionsRepository, PartnerRegistryService],
	exports: [AuthService],
})
export class AuthModule {}
