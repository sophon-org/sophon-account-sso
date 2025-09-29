import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { useContainer } from "class-validator";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	useContainer(app.select(AppModule), { fallbackOnErrors: true });

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	app.use(cookieParser());
	app.enableCors({
		origin: process.env.CORS_URL || "*",
		methods: ["GET", "POST", "HEAD", "OPTIONS"],
		credentials: true,
	});

	const cfg = app.get(ConfigService);
	const swaggerEnabled = cfg.getOrThrow<boolean>("SWAGGER_ENABLED");
	const _swaggerPath = cfg.getOrThrow<string>("SWAGGER_PATH");

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
