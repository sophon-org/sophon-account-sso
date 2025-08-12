import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { JwksModule } from "./jwks/jwks.module.js";

@Module({
	imports: [AuthModule, JwksModule],
})
export class AppModule {}
