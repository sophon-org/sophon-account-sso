import { Module } from "@nestjs/common";
import { PartnerRegistryModule } from "../partners/partner-registry.module";
import { Session } from "../sessions/session.entity";
import { SessionsRepository } from "../sessions/sessions.repository";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { MeService } from "./me.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
	imports: [PartnerRegistryModule, TypeOrmModule.forFeature([Session])],
	controllers: [AuthController],
	providers: [AuthService, MeService, AccessTokenGuard, SessionsRepository],
	exports: [AuthService],
})
export class AuthModule {}
