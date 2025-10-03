import { Module } from "@nestjs/common";
import { ConsentsModule } from "src/consents/consents.module";
import { HyperindexModule } from "src/hyperindex/hyperindex.module";
import { ConsentController } from "./consent.controller";
import { K1OwnerController } from "./k1-owner.controller";

@Module({
	imports: [ConsentsModule, HyperindexModule],
	controllers: [ConsentController, K1OwnerController],
})
export class MeModule {}
