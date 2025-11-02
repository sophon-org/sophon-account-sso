import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { AwsModule } from "src/aws/aws.module";
import { ConsentsModule } from "src/consents/consents.module";
import { HyperindexModule } from "src/hyperindex/hyperindex.module";
import { ConsentController } from "./consent.controller";
import { ContractController } from "./contract.controller";
import { ContractService } from "./contract.service";

@Module({
	imports: [ConsentsModule, HyperindexModule, AuthModule, AwsModule],
	controllers: [ConsentController, ContractController],
	providers: [ContractService],
})
export class MeModule {}
