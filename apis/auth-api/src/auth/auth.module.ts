// auth.module.ts
import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service";
import { PartnerRegistryModule } from "../partners/partner-registry.module";

@Module({
	imports: [PartnerRegistryModule],
	controllers: [AuthController],
	providers: [AuthService], // Make sure AuthService is here
	exports: [AuthService], // Add this if other modules need AuthService
})
export class AuthModule {}
