import { forwardRef, Module } from "@nestjs/common";
import { AwsModule } from "src/aws/aws.module";
import { HyperindexModule } from "src/hyperindex/hyperindex.module";
import { QueuesModule } from "src/queues/queues.module";
import { ContractController } from "./contract.controller";
import { ContractService } from "./contract.service";

@Module({
	imports: [AwsModule, HyperindexModule, forwardRef(() => QueuesModule)],
	controllers: [ContractController],
	providers: [ContractService],
	exports: [ContractService],
})
export class MeModule {}
