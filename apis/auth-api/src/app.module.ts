// src/app.module.ts
import * as crypto from "node:crypto";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { AwsModule } from "./aws/aws.module";
import { JwtKeysService } from "./aws/jwt-keys.service";
import { authConfig } from "./config/auth.config";
import { awsConfig } from "./config/aws.config";
import { dbConfig } from "./config/db.config";
import { validationSchema } from "./config/validation.schema";
import { ConsentsModule } from "./consents/consents.module";
import { HyperindexModule } from "./hyperindex/hyperindex.module";
import { JwksModule } from "./jwks/jwks.module";
import { MeModule } from "./me/me.module";
import { QueuesModule } from "./queues/queues.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [authConfig, dbConfig, awsConfig],
			validationSchema,
			cache: true,
			expandVariables: true,
		}),

		LoggerModule.forRoot({
			pinoHttp: {
				level: authConfig().logLevel,
				redact: ["req.headers.authorization", "req.headers.cookie"],
				genReqId: (req, res) => {
					const id =
						(req.headers["x-request-id"] as string) ?? crypto.randomUUID();
					res.setHeader("x-request-id", id);
					return id;
				},
				...(process.env.NODE_ENV === "production"
					? {}
					: {
							transport: {
								target: "pino-pretty",
								options: {
									colorize: true,
									translateTime: "HH:MM:ss.l",
									levelFirst: true,
									hideObject: false,
									messageFormat: "{context} - {msg}",
									ignore: "pid,hostname,context",
								},
							},
						}),
			},
			renameContext: "context",
		}),
		TypeOrmModule.forRootAsync({
			inject: [dbConfig.KEY, JwtKeysService],
			imports: [AwsModule],
			useFactory: async (
				db: ReturnType<typeof dbConfig>,
				jwtKeys: JwtKeysService,
			) => {
				let url = db.url || process.env.DATABASE_URL;
				if (!url) {
					url = await jwtKeys.getDatabaseUrl();
				}
				if (!url) throw new Error("Database URL is not set");

				return {
					type: "postgres",
					url,
					autoLoadEntities: true,
					synchronize: false,
				};
			},
		}),

		BullModule.forRoot({
			connection: { url: dbConfig().redisUrl },
		}),
		QueuesModule,
		AwsModule,
		AuthModule,
		JwksModule,
		HyperindexModule,
		ConsentsModule,
		MeModule,
	],
	controllers: [AppController],
	providers: [],
})
export class AppModule {}
