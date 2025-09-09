// auth.module.ts
import { Module } from "@nestjs/common";
import { PartnerRegistryModule } from "../partners/partner-registry.module";
import { SessionsRepository } from "../sessions/sessions.repository";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { MeService } from "./me.service";

@Module({
	imports: [PartnerRegistryModule],
	controllers: [AuthController],
	providers: [AuthService, MeService, AccessTokenGuard, SessionsRepository],
	exports: [AuthService],
})
export class AuthModule {}
