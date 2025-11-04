import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

import { CONTRACT_DEPLOY_QUEUE } from 'src/queues/queue.constants';
import { ContractDeployProcessor } from 'src/queues/workers/contract-deploy.processor';
import { ContractDeployQueue } from 'src/queues/workers/contract-deploy.queue';
import { ContractController } from 'src/me/contract.controller';
import { ContractService } from 'src/me/contract.service';
import { SecretsService } from 'src/aws/secrets.service';
import { HyperindexService } from 'src/hyperindex/hyperindex.service';

// ---- env needed by your config ----
beforeAll(() => {
  Object.assign(process.env, {
    ACCESS_TTL_S: '900',
    REFRESH_TTL_S: '1209600',
    NONCE_TTL_S: '300',
    COOKIE_ACCESS_MAX_AGE_S: '900',
    COOKIE_REFRESH_MAX_AGE_S: '1209600',
    JWT_KID: 'test-kid',
    JWT_ISSUER: 'test-issuer',
    NONCE_ISSUER: 'test-nonce-issuer',
    REFRESH_ISSUER: 'test-refresh-issuer',
    REFRESH_JWT_KID: 'test-refresh-kid',

    REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379/15',
    CHAIN_ID: process.env.CHAIN_ID || '300',
    SWAGGER_ENABLED: '0',
  });
});

// ---- mocks ----

// valid hex addresses + zero result so deploy path executes
jest.mock('@sophon-labs/account-core', () => ({
  CHAIN_CONTRACTS: {
    300: {
      accountFactory:  '0x0000000000000000000000000000000000000001',
      accountPaymaster:'0x0000000000000000000000000000000000000002',
    },
  },
  SOPHON_SALT_PREFIX: 'SOPHON',
  getDeployedSmartContractAddress: jest.fn().mockResolvedValue(
    '0x0000000000000000000000000000000000000000'
  ),
}));

// Accept any 0x... address and stub viem client
jest.mock('viem', () => {
  const real = jest.requireActual('viem');
  return {
    ...real,
    isAddress: () => true, // bypass checksum/casing
    zeroAddress: '0x0000000000000000000000000000000000000000',
    createWalletClient: jest.fn().mockReturnValue({
      extend: jest.fn().mockReturnThis(),
    }),
    http: () => ({}),
  };
});

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn().mockReturnValue({
    address: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
  }),
}));

jest.mock('viem/zksync', () => ({
  eip712WalletActions: jest.fn().mockReturnValue((c: any) => c),
}));

// Minimal chain + address utilities
jest.mock('src/utils/chain', () => ({
  getChainById: (id: any) => ({ id: Number(id) }),
}));
jest.mock('src/utils/address', () => ({
  normalizeAndValidateAddress: (a: string) => a.toLowerCase(),
}));

// Deploy returns deterministic address we assert on
jest.mock('zksync-sso/client', () => ({
  deployModularAccount: jest.fn().mockResolvedValue({
    address: '0xB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0',
  }),
}));

describe('Contract E2E (BullMQ + local Redis, no TypeORM)', () => {
  let app: INestApplication;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    const redisUrl = process.env.REDIS_URL!;

    const mod = await Test.createTestingModule({
      imports: [
        // real Redis connection, unique prefix to isolate test runs
        BullModule.forRoot({
          connection: { url: redisUrl },
          prefix: `authapi-e2e-${Date.now()}`,
        }),
        // register just the queue we need
        BullModule.registerQueue({ name: CONTRACT_DEPLOY_QUEUE }),
      ],
      controllers: [ContractController],
      providers: [
        // real service (uses our mocked deps)
        ContractService,
        // queue wrapper + worker
        ContractDeployQueue,
        ContractDeployProcessor,
        // mocked external deps required by ContractService
        {
          provide: SecretsService,
          useValue: {
            loadAWSSecrets: jest.fn().mockResolvedValue({
              deployer: { privateKey: '0x'.padEnd(66, '1') },
            }),
          },
        },
        {
          provide: HyperindexService,
          useValue: {
            // empty index so deploy path executes
            getK1OwnerStateByOwner: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      const queue = app.get<Queue>(getQueueToken(CONTRACT_DEPLOY_QUEUE));
      await queue.close().catch(() => void 0);
      await app.close();
    }
  });

  it('POST /contract/:owner → job enqueued and completed by worker', async () => {
    const owner = '0x19e7e376e7c213b7e7e46cc70a5dd086daff2a';

    // enqueue
    const { body } = await request(app.getHttpServer())
      .post(`/contract/${owner}`)
      .expect(202);

    const jobId = body.jobId as string;
    expect(jobId).toBeTruthy();

    // poll until completed
    const started = Date.now();
    let state = 'waiting';
    let result: any;

    while (Date.now() - started < 20_000) {
      const res = await request(app.getHttpServer())
        .get(`/contract/jobs/${encodeURIComponent(jobId)}`)
        .expect(200);

      state = res.body.state;
      if (state === 'failed') {
        // if something goes wrong you'll see it in the CI logs
        // eslint-disable-next-line no-console
        console.error('Job failedReason:', res.body.failedReason);
        break;
      }
      if (state === 'completed') {
        result = res.body.result;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    expect(state).toBe('completed');
    expect(result.owner.toLowerCase()).toBe(owner.toLowerCase());
    expect(result.contracts).toEqual([
      '0xB0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0',
    ]);
  });
});
