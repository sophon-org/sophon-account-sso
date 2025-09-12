import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "./auth/auth.module.js";
import { AllExceptionsFilter } from "./common/all-exceptions.filter.js";
import { JwksModule } from "./jwks/jwks.module.js";

// config pieces
import { authConfig } from "./config/auth.config";
import { dbConfig } from "./config/db.config";
import { validationSchema } from "./config/validation.schema";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [authConfig, dbConfig],
			validationSchema,
			cache: true,
			expandVariables: true,
		}),
		TypeOrmModule.forRootAsync({
			inject: [dbConfig.KEY],
			useFactory: (db: ReturnType<typeof dbConfig>) => ({
				type: "postgres",
				url: db.url,
				autoLoadEntities: true,
				synchronize: false,
			}),
		}),

		AuthModule,
		JwksModule,
	],
	providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
