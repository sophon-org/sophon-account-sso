import type { ContractDeployResponse } from "src/me/dto/contract-deploy-response.dto";
import type { Address } from "viem";

export interface DeployJobData {
	owner: Address;
	chainId: number;
}

export type DeployJobResult = ContractDeployResponse;
