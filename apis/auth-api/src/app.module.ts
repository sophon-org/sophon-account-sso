import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/all-exceptions.filter.js";
import { AuthModule } from "./auth/auth.module.js";
import { JwksModule } from "./jwks/jwks.module.js";

@Module({
	imports: [AuthModule, JwksModule],
	providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
