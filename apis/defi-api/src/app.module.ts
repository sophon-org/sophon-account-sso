import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GetAppConfiguration } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [GetAppConfiguration],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
