// main.ts
import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { useContainer } from "class-validator";
import cookieParser from "cookie-parser";
import { Logger as PinoLogger } from "nestjs-pino"; // <-- import token
import { AppModule } from "./app.module";
import { SentryAwareAllExceptionsFilter } from "./common/sentry-aware-all-exceptions.filter";
import { initSentry } from "./observability/sentry.init";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	try {
		const pino = await app.resolve(PinoLogger);
		app.useLogger(pino);
	} catch {
		// optional: fall back to default Nest logger
	}

	initSentry();
	useContainer(app.select(AppModule), { fallbackOnErrors: true });

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);
	app.useGlobalFilters(new SentryAwareAllExceptionsFilter());
	app.use(cookieParser());
	app.enableCors({
		origin: process.env.CORS_URL || "*",
		methods: ["GET", "POST", "HEAD", "OPTIONS"],
		credentials: true,
	});

	const cfg = app.get(ConfigService);
	const swaggerEnabled = cfg.getOrThrow<boolean>("SWAGGER_ENABLED");

	if (swaggerEnabled) {
		const config = new DocumentBuilder()
			.setTitle("Sophon Auth API")
			.setDescription("SIWE + JWT authentication backend for Sophon")
			.setVersion("1.0")
			.addBearerAuth()
			.addCookieAuth("access_token", { type: "apiKey", in: "cookie" })
			.build();

		const document = SwaggerModule.createDocument(app, config);
		SwaggerModule.setup("docs", app, document, {
			swaggerOptions: {
				withCredentials: true,
				persistAuthorization: true,
			},
		});
	}

	await app.listen(process.env.PORT || 3000);
}
void bootstrap();
