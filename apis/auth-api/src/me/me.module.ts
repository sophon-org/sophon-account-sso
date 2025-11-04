import { Module, forwardRef } from "@nestjs/common";
import { QueuesModule } from "src/queues/queues.module";
import { ContractController } from "./contract.controller";
import { ContractService } from "./contract.service";
import { AwsModule } from "src/aws/aws.module";
import { HyperindexModule } from "src/hyperindex/hyperindex.module";

@Module({
	imports: [AwsModule, HyperindexModule, forwardRef(() => QueuesModule)],
	controllers: [ContractController],
	providers: [ContractService],
	exports: [ContractService],
})
export class MeModule {}
