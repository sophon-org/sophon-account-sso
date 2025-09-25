import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { hyperindexConfig } from "../config/hyperindex.config";
import { HyperindexService } from "./hyperindex.service";
import { MeController } from "./me.controller";

@Module({
	imports: [ConfigModule.forFeature(hyperindexConfig)],
	providers: [HyperindexService],
	controllers: [MeController],
	exports: [HyperindexService],
})
export class HyperindexModule {}
