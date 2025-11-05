import { BullModule } from "@nestjs/bullmq";
import { forwardRef, Module } from "@nestjs/common";
import { MeModule } from "src/me/me.module";
import { CONTRACT_DEPLOY_QUEUE } from "./queue.constants";
import { ContractDeployProcessor } from "./workers/contract-deploy.processor";
import { ContractDeployQueue } from "./workers/contract-deploy.queue";

@Module({
	imports: [
		BullModule.registerQueue({ name: CONTRACT_DEPLOY_QUEUE }),
		forwardRef(() => MeModule),
	],
	providers: [ContractDeployProcessor, ContractDeployQueue],
	exports: [ContractDeployQueue],
})
export class QueuesModule {}
