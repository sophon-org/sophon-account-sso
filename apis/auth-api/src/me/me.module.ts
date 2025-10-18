import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ConsentsModule } from "src/consents/consents.module";
import { HyperindexModule } from "src/hyperindex/hyperindex.module";
import { ConsentController } from "./consent.controller";
import { K1OwnerController } from "./contract.controller";

@Module({
	imports: [ConsentsModule, HyperindexModule, AuthModule],
	controllers: [ConsentController, K1OwnerController],
})
export class MeModule {}
