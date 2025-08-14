// auth.module.ts
import { Module } from "@nestjs/common";
import { PartnerRegistryModule } from "../partners/partner-registry.module";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service";

@Module({
	imports: [PartnerRegistryModule],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService],
})
export class AuthModule {}
