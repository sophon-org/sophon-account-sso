import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
	CHAIN_CONTRACTS,
	deployBiconomyAccount,
	getBiconomyAccountsByOwner,
	getDeployedSmartContractAddress,
	isOsChainId,
	parseChainId,
	SOPHON_SALT_PREFIX,
	SophonChains,
} from "@sophon-labs/account-core";
import { SecretsService } from "src/aws/secrets.service";
import { HyperindexService } from "src/hyperindex/hyperindex.service";
import { normalizeAndValidateAddress } from "src/utils/address";
import {
	Address,
	createWalletClient,
	http,
	isAddress,
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
		const chainId = parseChainId(process.env.CHAIN_ID);

		this.logger.log(
			{ evt: "contract.by-owner.request", owner: address, chainId },
			"contract-by-owner",
		);

		// Route to appropriate implementation based on chain
		if (isOsChainId(chainId)) {
			return this.getContractByOwnerBiconomy(address);
		}

		return this.getContractByOwnerZkSync(address);
	}

	/**
	 * Fetch the deployed contract address for zkSync chains using Hyperindex
	 */
	private async getContractByOwnerZkSync(owner: Address): Promise<Address[]> {
		const rows = await this.hyperindex.getK1OwnerStateByOwner(owner);

		this.logger.log(
			{ evt: "contract.by-owner.success", owner, total: rows.length },
			"contract-by-owner",
		);

		return rows?.map((row) => row.accounts[0]) ?? [];
	}

	/**
	 * Fetch the deployed contract address for Biconomy chains (no Hyperindex)
	 */
	private async getContractByOwnerBiconomy(owner: Address): Promise<Address[]> {
		const chainId = parseChainId(process.env.CHAIN_ID);

		const accounts = await getBiconomyAccountsByOwner(chainId, owner);

		this.logger.log(
			{
				evt: "contract.by-owner.biconomy.success",
				owner,
				total: accounts.length,
			},
			"contract-by-owner",
		);

		return accounts;
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
		const chainId = parseChainId(process.env.CHAIN_ID);

		this.logger.log(
			{ evt: "me.contract.deploy.request", owner: ownerAddress, chainId },
			"contract-deploy",
		);

		// Route to appropriate implementation based on chain
		if (isOsChainId(chainId)) {
			return this.deployContractForOwnerBiconomy(ownerAddress);
		}

		return this.deployContractForOwnerZkSync(ownerAddress);
	}

	/**
	 * Deploy contract using zkSync SSO for old chains
	 */
	private async deployContractForOwnerZkSync(
		owner: Address,
	): Promise<ContractDeployResponse> {
		const chainId = parseChainId(process.env.CHAIN_ID);

		// sanity check
		const existingContracts = await this.getContractByOwnerZkSync(owner);
		if (existingContracts.length > 0) {
			this.logger.log("Contract already exists on index");
			return {
				contracts: existingContracts,
				owner,
			};
		}

		const chain = SophonChains[chainId];
		const secrets = await this.secretsService.loadAWSSecrets();
		const deployerAccount = privateKeyToAccount(secrets.deployer.privateKey);

		// there are cases when the index don't have the information yet, so we need to verify contract salt
		const deployedContract = await getDeployedSmartContractAddress(
			chain,
			owner,
			deployerAccount.address,
		);
		if (deployedContract && deployedContract !== zeroAddress) {
			this.logger.log("Contract already exists on chain");
			return {
				contracts: [deployedContract],
				owner,
			};
		}

		// deploy the contract
		const deployerClient = createWalletClient({
			account: deployerAccount,
			chain: chain,
			transport: http(),
		}).extend(eip712WalletActions());

		this.logger.log("Deploying contract");
		const deployedAccount = await deployModularAccount(deployerClient, {
			accountFactory: CHAIN_CONTRACTS[chain.id].accountFactory,
			paymaster: {
				location: CHAIN_CONTRACTS[chain.id].accountPaymaster,
			},
			uniqueAccountId: SOPHON_SALT_PREFIX,
			owners: [owner],
			installNoDataModules: [],
		});

		return {
			contracts: [deployedAccount.address],
			owner,
		};
	}

	/**
	 * Deploy contract using Biconomy Nexus for new OS chains
	 */
	private async deployContractForOwnerBiconomy(
		owner: Address,
	): Promise<ContractDeployResponse> {
		const chainId = parseChainId(process.env.CHAIN_ID);

		// Check if already deployed (no Hyperindex, go straight to on-chain check)
		const existingContracts = await this.getContractByOwnerBiconomy(owner);
		if (existingContracts.length > 0) {
			this.logger.log("Contract already exists on chain");
			return {
				contracts: existingContracts,
				owner,
			};
		}

		// Deploy using Biconomy
		//const secrets = await this.secretsService.loadAWSSecrets();
		this.logger.log("Deploying contract with Biconomy Nexus");

		const result = await deployBiconomyAccount(
			chainId,
			owner,
			"0x0a64c2dbb70fb9059a354312467af1a5a6d4e041b67bcbebc11b1d7492d19142",
			"", // Empty string for sophonName (SNS not implemented yet)
		);

		this.logger.log({
			evt: "me.contract.deploy.biconomy.success",
			owner,
			address: result.accountAddress,
			alreadyDeployed: result.alreadyDeployed,
			txHash: result.transactionHash,
		});

		return {
			contracts: [result.accountAddress],
			owner,
		};
	}
}
