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

function normalizeAddress(s: string | undefined | null): `0x${string}` {
	const v = (s ?? "").trim().toLowerCase();
	if (!/^0x[0-9a-f]{40}$/.test(v)) {
		throw new BadRequestException("Invalid address");
	}
	return v as `0x${string}`;
}

@ApiTags("Smart Contract")
@Controller("contract")
export class K1OwnerController {
	constructor(
		private readonly hyperindex: HyperindexService,
		@InjectPinoLogger(K1OwnerController.name)
		private readonly logger: PinoLogger,
	) {}

	@Get("by-owner/:owner")
	@ApiParam({
		name: "owner",
		description: "EOA address (0x...) to fetch K1 owner state for",
		example: "0x19e7e376e7c213b7e7e46cc70a5dd086daff2a",
	})
	@ApiOkResponse({ type: K1OwnerStateDto, isArray: true })
	async byOwner(@Param("owner") owner: string) {
		if (!owner || !isAddress(owner.toLowerCase())) {
			throw new BadRequestException("Invalid address");
		}

		const address = normalizeAddress(owner);
		this.logger.info(
			{ evt: "me.k1_owner_state.request", owner: address },
			"k1-owner-state",
		);
		const rows = await this.hyperindex.getK1OwnerStateByOwner(address);
		this.logger.info(
			{ evt: "me.k1_owner_state.success", owner: address, total: rows.length },
			"k1-owner-state",
		);

		console.log(
			"🔥 🔥 🔥 🔥 🔥 existing accounts",
			rows.flatMap((row) => row.accounts),
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
		if (!owner || !isAddress(owner.toLowerCase())) {
			throw new BadRequestException("Invalid address");
		}

		const ownerAddress = normalizeAddress(owner);

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
			network,
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
