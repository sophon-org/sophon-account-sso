import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_FILTER } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module.js";
import { AllExceptionsFilter } from "./common/all-exceptions.filter.js";
import { JwksModule } from "./jwks/jwks.module.js";

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: "postgres",
			url: process.env.DATABASE_URL,
			autoLoadEntities: true,
		}),
		AuthModule,
		JwksModule,
	],
	providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
