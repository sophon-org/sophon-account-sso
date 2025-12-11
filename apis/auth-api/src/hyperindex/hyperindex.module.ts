import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { HyperindexService } from "./hyperindex.service";

@Module({
	imports: [AuthModule],
	providers: [HyperindexService],
	exports: [HyperindexService],
})
export class HyperindexModule {}
