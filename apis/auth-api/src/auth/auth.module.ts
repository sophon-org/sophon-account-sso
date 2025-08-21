// auth.module.ts
import { Module } from "@nestjs/common";
import { PartnerRegistryModule } from "../partners/partner-registry.module";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { MeService } from "./me.service";

@Module({
	imports: [PartnerRegistryModule],
	controllers: [AuthController],
	providers: [AuthService, MeService, AccessTokenGuard],
	exports: [AuthService],
})
export class AuthModule {}
