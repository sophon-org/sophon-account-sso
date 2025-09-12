import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "./auth/auth.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { JwksModule } from "./jwks/jwks.module";

import { authConfig } from "./config/auth.config";
import { dbConfig } from "./config/db.config";
import { validationSchema } from "./config/validation.schema";
import { awsConfig } from "./config/aws.config";
import { AwsModule } from "./aws/aws.module";
import { JwtKeysService } from "./aws/jwt-keys.service";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [authConfig, dbConfig, awsConfig],
			validationSchema,
			cache: true,
			expandVariables: true,
		}),
		TypeOrmModule.forRootAsync({
			inject: [dbConfig.KEY, JwtKeysService],
			imports: [AwsModule],
			useFactory: async (
				db: ReturnType<typeof dbConfig>,
				jwtKeys: JwtKeysService,
			) => {
				let url = db.url || process.env.DATABASE_URL;
				if (!url) url = (await jwtKeys.getDatabaseUrl()) ?? undefined;

				return {
					type: "postgres",
					url,
					autoLoadEntities: true,
					synchronize: false,
				};
			},
		}),

		AwsModule,
		AuthModule,
		JwksModule,
	],
	providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
