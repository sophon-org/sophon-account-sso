import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GetAppConfiguration } from './config/configuration';
import { SwapModule } from './modules/swap.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [GetAppConfiguration],
    }),
    SwapModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
