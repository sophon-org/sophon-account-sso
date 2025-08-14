import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { useContainer } from "class-validator";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/all-exceptions.filter.js";

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
	app.useGlobalFilters(new AllExceptionsFilter());

	const config = new DocumentBuilder()
		.setTitle("Sophon Auth API")
		.setDescription("SIWE + JWT authentication backend for Sophon")
		.setVersion("1.0")
		.addCookieAuth("access_token")
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("docs", app, document);

	await app.listen(process.env.PORT || 3000);
}
void bootstrap();
