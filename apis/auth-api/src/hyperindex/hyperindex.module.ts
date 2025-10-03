import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { hyperindexConfig } from "../config/hyperindex.config";
import { HyperindexService } from "./hyperindex.service";

@Module({
	imports: [ConfigModule.forFeature(hyperindexConfig), AuthModule],
	providers: [HyperindexService],
	exports: [HyperindexService],
})
export class HyperindexModule {}
