import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
	CHAIN_CONTRACTS,
	getDeployedSmartContractAddress,
	SOPHON_SALT_PREFIX,
} from "@sophon-labs/account-core";
import { SecretsService } from "src/aws/secrets.service";
import { HyperindexService } from "src/hyperindex/hyperindex.service";
import { normalizeAndValidateAddress } from "src/utils/address";
import { getChainById, SupportedChainId } from "src/utils/chain";
import {
	Account,
	Address,
	Chain,
	createWalletClient,
	http,
	isAddress,
	Transport,
	WalletClient,
	zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { eip712WalletActions } from "viem/zksync";
import { deployModularAccount } from "zksync-sso/client";
import { ContractDeployResponse } from "./dto/contract-deploy-response.dto";

@Injectable()
export class ContractService {
	private logger = new Logger(ContractService.name);

	constructor(
		private readonly hyperindex: HyperindexService,
		private readonly secretsService: SecretsService,
	) {}

	/**
	 * Fetch the deployed contract address for a given owner, if deployed.
	 *
	 * @param owner the wallet addres that's signer of the contract
	 * @returns the deployed contract address, if available
	 */
	async getContractByOwner(owner: Address): Promise<Address[]> {
		if (!owner?.trim() || !isAddress(owner.toLowerCase())) {
			throw new BadRequestException(`Invalid address provided: ${owner}`);
		}

		const address = normalizeAndValidateAddress(owner);
		this.logger.log(
			{ evt: "contract.by-owner.request", owner: address },
			"contract-by-owner",
		);
		const rows = await this.hyperindex.getK1OwnerStateByOwner(address);

		this.logger.log(
			{ evt: "contract.by-owner.success", owner: address, total: rows.length },
			"contract-by-owner",
		);

		return rows?.map((row) => row.accounts[0]) ?? [];
	}

	/**
	 * Deploy contract for owner
	 *
	 * @param owner the wallet addres that's signer of the contract
	 * @returns the deployed contract address, if available
	 */
	async deployContractForOwner(
		owner: Address,
	): Promise<ContractDeployResponse> {
		if (!owner?.trim() || !isAddress(owner.toLowerCase())) {
			throw new BadRequestException(`Invalid address provided: ${owner}`);
		}

		const ownerAddress = normalizeAndValidateAddress(owner);

		// sanity check
		this.logger.log(
			{ evt: "me.contract.deploy.request", owner: ownerAddress },
			"contract-deploy",
		);
		const existingContracts = await this.getContractByOwner(ownerAddress);
		if (existingContracts.length > 0) {
			this.logger.log("Contract already exists on index");
			return {
				contracts: existingContracts,
				owner: ownerAddress,
			};
		}

		const chain = getChainById(process.env.CHAIN_ID as SupportedChainId);
		const secrets = await this.secretsService.loadAWSSecrets();
		const deployerAccount = privateKeyToAccount(secrets.deployer.privateKey);

		// there are cases when the index don't have the information yet, so we need to verify contract salt
		const deployedContract = await getDeployedSmartContractAddress(
			chain,
			ownerAddress,
			deployerAccount.address,
		);
		if (deployedContract && deployedContract !== zeroAddress) {
			this.logger.log("Contract already exists on chain");
			return {
				contracts: [deployedContract],
				owner: ownerAddress,
			};
		}

		// deploy the contract
		const deployerClient = createWalletClient({
			account: deployerAccount,
			chain,
			transport: http(),
		}).extend(eip712WalletActions());

		this.logger.log("Deploying contract");
		const deployedAccount = await deployModularAccount(deployerClient, {
			accountFactory: CHAIN_CONTRACTS[chain.id].accountFactory,
			paymaster: {
				location: CHAIN_CONTRACTS[chain.id].accountPaymaster,
			},
			uniqueAccountId: SOPHON_SALT_PREFIX,
			owners: [ownerAddress],
			installNoDataModules: [],
		});

		return {
			contracts: [deployedAccount.address],
			owner: ownerAddress,
		};
	}
}
