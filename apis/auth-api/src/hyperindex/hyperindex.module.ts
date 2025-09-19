import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { hyperindexConfig } from "../config/hyperindex.config";
import { HyperindexService } from "./hyperindex.service";
import { K1OwnersController } from "./k1-owners.controller";

@Module({
  imports: [ConfigModule.forFeature(hyperindexConfig)],
  providers: [HyperindexService],
  controllers: [K1OwnersController],
  exports: [HyperindexService],
})
export class HyperindexModule {}