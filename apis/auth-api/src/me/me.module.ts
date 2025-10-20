import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { ConsentsModule } from "src/consents/consents.module";
import { HyperindexModule } from "src/hyperindex/hyperindex.module";
import { ConsentController } from "./consent.controller";
import { ContractController } from "./contract.controller";
import { AwsModule } from "src/aws/aws.module";

@Module({
	imports: [ConsentsModule, HyperindexModule, AuthModule, AwsModule],
	controllers: [ConsentController, ContractController],
})
export class MeModule {}
