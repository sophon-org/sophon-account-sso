import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";
import {
	CHAIN_CONTRACTS,
	getDeployedSmartContractAddress,
	SOPHON_SALT_PREFIX,
} from "@sophon-labs/account-core";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import {
	Account,
	Chain,
	createWalletClient,
	http,
	isAddress,
	Transport,
	WalletClient,
	zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sophon, sophonTestnet } from "viem/chains";
import { eip712WalletActions } from "viem/zksync";
import { deployModularAccount } from "zksync-sso/client";
import { K1OwnerStateDto } from "../hyperindex/dto/k1-owner-state.dto";
import { HyperindexService } from "../hyperindex/hyperindex.service";
import { normalizeAndValidateAddress } from "src/utils/address";

@ApiTags("Smart Contract")
@Controller("contract")
export class ContractController {
	constructor(
		private readonly hyperindex: HyperindexService,
		@InjectPinoLogger(ContractController.name)
		private readonly logger: PinoLogger,
	) {}

	@Get("by-owner/:owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) signer of the contract",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiOkResponse({ type: K1OwnerStateDto, isArray: true })
	async byOwner(@Param("owner") owner: string) {
		if (!owner?.trim() || !isAddress(owner.toLowerCase())) {
			throw new BadRequestException(`Invalid address provided: ${owner}`);
		}

		const address = normalizeAndValidateAddress(owner);
		this.logger.info(
			{ evt: "contract.by-owner.request", owner: address },
			"contract-by-owner",
		);
		const rows = await this.hyperindex.getK1OwnerStateByOwner(address);
		this.logger.info(
			{ evt: "contract.by-owner.success", owner: address, total: rows.length },
			"contract-by-owner",
		);
		return rows.map((row) => row.accounts[0])[0];
	}

	@Get(":owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) to deploy smart contract as signer",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiOkResponse({ type: K1OwnerStateDto, isArray: true })
	async deploy(@Param("owner") owner: string) {
		if (!owner?.trim() || !isAddress(owner.toLowerCase())) {
			throw new BadRequestException(`Invalid address provided: ${owner}`);
		}

		const ownerAddress = normalizeAndValidateAddress(owner);

		// sanity check
		this.logger.info(
			{ evt: "me.contract.deploy.request", owner: ownerAddress },
			"contract-deploy",
		);
		const existingContract = await this.byOwner(ownerAddress);
		if (existingContract) {
			this.logger.info("Contract already exists on index");
			return {
				address: existingContract,
				owner: ownerAddress,
			};
		}

		const network = process.env.CHAIN_ID === "50104" ? sophon : sophonTestnet;

		// there are cases when the index don't have the information yet, so we need to verify contract salt
		const deployedContract = await getDeployedSmartContractAddress(
			// biome-ignore lint/suspicious/noExplicitAny: remove after generating a new version
			network as any,
			ownerAddress,
			ownerAddress,
		);
		if (deployedContract && deployedContract !== zeroAddress) {
			this.logger.info("Contract already exists on chain");
			return {
				address: deployedContract,
				owner: ownerAddress,
			};
		}

		const deployerAccount = privateKeyToAccount(
			process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`,
		);

		// deploy the contract
		const deployerClient: WalletClient<Transport, Chain, Account> =
			createWalletClient({
				account: deployerAccount,
				chain: network,
				transport: http(),
			}).extend(eip712WalletActions());

		this.logger.info("Deploying contract");
		const deployedAccount = await deployModularAccount(deployerClient, {
			accountFactory: CHAIN_CONTRACTS[network.id].accountFactory,
			paymaster: {
				location: CHAIN_CONTRACTS[network.id].accountPaymaster,
			},
			uniqueAccountId: SOPHON_SALT_PREFIX,
			owners: [ownerAddress],
			installNoDataModules: [],
		});

		return {
			address: deployedAccount.address,
			owner: ownerAddress,
		};
	}
}
