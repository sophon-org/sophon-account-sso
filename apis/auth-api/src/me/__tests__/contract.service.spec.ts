import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { SecretsService } from "src/aws/secrets.service";
import { HyperindexService } from "src/hyperindex/hyperindex.service";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import { ContractService } from "../contract.service";

jest.mock("@sophon-labs/account-core", () => {
	const { sophonTestnet } = jest.requireActual("viem/chains");
	return {
		CHAIN_CONTRACTS: {
			531050104: {
				accountFactory: "0xFactoryAddress" as Address,
				accountPaymaster: "0xPaymasterAddress" as Address,
			},
		},
		getDeployedSmartContractAddress: jest.fn(),
		SOPHON_SALT_PREFIX: "sophon-salt",
		SophonChains: {
			531050104: sophonTestnet,
		},
		isOsChainId: jest.fn(() => false),
	};
});

jest.mock("zksync-sso/client", () => ({
	deployModularAccount: jest.fn(),
}));

jest.mock("viem/accounts", () => ({
	privateKeyToAccount: jest.fn(),
}));

jest.mock("viem", () => ({
	...jest.requireActual("viem"),
	createWalletClient: jest.fn(() => ({
		extend: jest.fn(() => ({})),
	})),
}));

jest.mock("viem/zksync", () => ({
	eip712WalletActions: jest.fn(() => ({})),
}));

import { getDeployedSmartContractAddress } from "@sophon-labs/account-core";
import { privateKeyToAccount } from "viem/accounts";
import { sophonTestnet } from "viem/chains";
import { deployModularAccount } from "zksync-sso/client";

describe("ContractService", () => {
	let contractService: ContractService;

	const validAddress = "0x1234567890123456789012345678901234567890" as Address;
	const deployedAddress =
		"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address;

	const hyperindexServiceMock = {
		getK1OwnerStateByOwner: jest.fn(),
	};

	const secretsServiceMock = {
		loadAWSSecrets: jest.fn(),
	};

	const originalEnv = { ...process.env };

	beforeEach(async () => {
		process.env.CHAIN_ID = `${sophonTestnet.id}`;

		const moduleRef = await Test.createTestingModule({
			providers: [
				ContractService,
				{ provide: HyperindexService, useValue: hyperindexServiceMock },
				{ provide: SecretsService, useValue: secretsServiceMock },
			],
		}).compile();

		contractService = moduleRef.get(ContractService);
		jest.clearAllMocks();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	describe("getContractByOwner", () => {
		it("fails with invalid address provided - empty string", async () => {
			// given
			const invalidAddress = "" as Address;

			// when
			const promise = contractService.getContractByOwner(
				invalidAddress,
				531050104,
			);

			// then
			await expect(promise).rejects.toThrow(BadRequestException);
			await expect(promise).rejects.toThrow("Invalid address provided");
		});

		it("fails with invalid address provided - not a valid ethereum address", async () => {
			// given
			const invalidAddress = "not-an-address" as Address;

			// when
			const promise = contractService.getContractByOwner(
				invalidAddress,
				531050104,
			);

			// then
			await expect(promise).rejects.toThrow(BadRequestException);
			await expect(promise).rejects.toThrow("Invalid address provided");
		});

		it("calls hyperindex getK1OwnerStateByOwner with proper parameter and returns wallet when existing", async () => {
			// given
			const mockResponse = [
				{
					accounts: [deployedAddress],
				},
			];
			hyperindexServiceMock.getK1OwnerStateByOwner.mockResolvedValue(
				mockResponse,
			);

			// when
			const result = await contractService.getContractByOwner(
				validAddress,
				531050104,
			);

			// then
			expect(hyperindexServiceMock.getK1OwnerStateByOwner).toHaveBeenCalledWith(
				validAddress,
				531050104,
			);
			expect(
				hyperindexServiceMock.getK1OwnerStateByOwner,
			).toHaveBeenCalledTimes(1);
			expect(result).toEqual([deployedAddress]);
		});

		it("calls hyperindex getK1OwnerStateByOwner and returns [] when empty array", async () => {
			// given
			hyperindexServiceMock.getK1OwnerStateByOwner.mockResolvedValue([]);

			// when
			const result = await contractService.getContractByOwner(
				validAddress,
				531050104,
			);

			// then
			expect(hyperindexServiceMock.getK1OwnerStateByOwner).toHaveBeenCalledWith(
				validAddress,
				531050104,
			);
			expect(
				hyperindexServiceMock.getK1OwnerStateByOwner,
			).toHaveBeenCalledTimes(1);
			expect(result).toEqual([]);
		});
	});

	describe("deployContractForOwner", () => {
		it("can only be called with valid address - empty string", async () => {
			// given
			const invalidAddress = "" as Address;

			// when
			const promise = contractService.deployContractForOwner(
				invalidAddress,
				531050104,
			);

			// then
			await expect(promise).rejects.toThrow(BadRequestException);
			await expect(promise).rejects.toThrow("Invalid address provided");
		});

		it("can only be called with valid address - invalid format", async () => {
			// given
			const invalidAddress = "invalid" as Address;

			// when
			const promise = contractService.deployContractForOwner(
				invalidAddress,
				531050104,
			);

			// then
			await expect(promise).rejects.toThrow(BadRequestException);
			await expect(promise).rejects.toThrow("Invalid address provided");
		});

		it("wont deploy a new contract if the owner is already a signer returned by hyperindex", async () => {
			// given
			const mockResponse = [
				{
					accounts: [deployedAddress],
				},
			];
			hyperindexServiceMock.getK1OwnerStateByOwner.mockResolvedValue(
				mockResponse,
			);

			// when
			const result = await contractService.deployContractForOwner(
				validAddress,
				531050104,
			);

			// then
			expect(hyperindexServiceMock.getK1OwnerStateByOwner).toHaveBeenCalledWith(
				validAddress,
				531050104,
			);
			expect(result).toEqual({
				contracts: [deployedAddress],
				owner: validAddress,
			});
			expect(getDeployedSmartContractAddress).not.toHaveBeenCalled();
			expect(deployModularAccount).not.toHaveBeenCalled();
		});

		it("wont deploy a new contract if the owner is already a signer returned by getDeployedSmartContractAddress when hyperindex returns no contract", async () => {
			// given
			const mockAccount = { address: "0xMockAccount" };
			hyperindexServiceMock.getK1OwnerStateByOwner.mockResolvedValue([]);
			(getDeployedSmartContractAddress as jest.Mock).mockResolvedValue(
				deployedAddress,
			);
			(privateKeyToAccount as jest.Mock).mockReturnValue(mockAccount);
			secretsServiceMock.loadAWSSecrets.mockResolvedValue({
				deployer: {
					privateKey: "0xPrivateKey",
				},
			});

			// when
			const result = await contractService.deployContractForOwner(
				validAddress,
				531050104,
			);

			// then
			expect(hyperindexServiceMock.getK1OwnerStateByOwner).toHaveBeenCalledWith(
				validAddress,
				531050104,
			);
			expect(getDeployedSmartContractAddress).toHaveBeenCalledWith(
				expect.objectContaining({ id: sophonTestnet.id }),
				validAddress,
				mockAccount.address,
			);
			expect(result).toEqual({
				contracts: [deployedAddress],
				owner: validAddress,
			});
			expect(deployModularAccount).not.toHaveBeenCalled();
		});

		it("calls deployModularAccount to deploy the new contract when both hyperindex and utils wont find existing contract deployed", async () => {
			// given
			const newDeployedAddress =
				"0x9999999999999999999999999999999999999999" as Address;
			const mockAccount = { address: "0xMockAccount" };

			hyperindexServiceMock.getK1OwnerStateByOwner.mockResolvedValue([]);
			(getDeployedSmartContractAddress as jest.Mock).mockResolvedValue(
				zeroAddress,
			);
			(privateKeyToAccount as jest.Mock).mockReturnValue(mockAccount);
			secretsServiceMock.loadAWSSecrets.mockResolvedValue({
				deployer: {
					privateKey: "0xPrivateKey",
				},
			});
			(deployModularAccount as jest.Mock).mockResolvedValue({
				address: newDeployedAddress,
			});

			// when
			const result = await contractService.deployContractForOwner(
				validAddress,
				531050104,
			);

			// then
			expect(hyperindexServiceMock.getK1OwnerStateByOwner).toHaveBeenCalledWith(
				validAddress,
				531050104,
			);
			expect(getDeployedSmartContractAddress).toHaveBeenCalledWith(
				expect.objectContaining({ id: sophonTestnet.id }),
				validAddress,
				mockAccount.address,
			);
			expect(secretsServiceMock.loadAWSSecrets).toHaveBeenCalled();
			expect(deployModularAccount).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					accountFactory: "0xFactoryAddress",
					paymaster: {
						location: "0xPaymasterAddress",
					},
					uniqueAccountId: "sophon-salt",
					owners: [validAddress],
					installNoDataModules: [],
				}),
			);
			expect(result).toEqual({
				contracts: [newDeployedAddress],
				owner: validAddress,
			});
		});
	});
});
