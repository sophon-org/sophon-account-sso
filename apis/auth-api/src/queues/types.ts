import type { Address } from "viem";
import type { ContractDeployResponse } from "src/me/dto/contract-deploy-response.dto";

export interface DeployJobData {
	owner: Address;
	chainId: number;
}

export type DeployJobResult = ContractDeployResponse;
