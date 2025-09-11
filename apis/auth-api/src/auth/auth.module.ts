import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PartnerRegistryModule } from "../partners/partner-registry.module";
import { Session } from "../sessions/session.entity";
import { SessionsRepository } from "../sessions/sessions.repository";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { MeService } from "./me.service";

@Module({
	imports: [PartnerRegistryModule, TypeOrmModule.forFeature([Session])],
	controllers: [AuthController],
	providers: [AuthService, MeService, AccessTokenGuard, SessionsRepository],
	exports: [AuthService],
})
export class AuthModule {}
