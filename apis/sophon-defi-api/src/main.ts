import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as packageJson from '../package.json';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const prefix = config.get('pathPrefix');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      dnsPrefetchControl: true,
      frameguard: true,
      hsts: true,
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: true,
      xssFilter: true,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: process.env.DAPP_URL || '*',
    methods: ['GET', 'POST', 'HEAD'],
    credentials: true,
  });

  app.setGlobalPrefix(prefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sophon DeFi API')
    .setDescription('Sophon DeFi API')
    .setVersion(packageJson.version)
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'Partner API key for authentication',
      },
      'partner_api_key',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-INTERNAL-API-KEY',
        description: 'Internal API key for authentication',
      },
      'internal_api_key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(prefix, app, document);

  const port = config.get('port');
  const bind = config.get('bind');

  Logger.log(
    `Starting application on http://127.0.0.1:${port}/${prefix}`,
    'NestApplication',
  );
  Logger.log(
    `Binding application on http://${bind}:${port}/${prefix}`,
    'NestApplication',
  );
  await app.listen(port);
}
bootstrap();
