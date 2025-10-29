// tests/predict-nexus-offchain.spec.ts
import { describe, it, expect } from 'vitest';
import { predictNexusOffchain } from '../predict-nexus-offchain';
import type { Hex } from 'viem';

// ── Embedded constants (Sophon OS testnet)
const FACTORY = '0x0000006648ED9B2B842552BE63Af870bC74af837' as `0x${string}`;
const IMPLEMENTATION =
  '0x00000000383e8cBe298514674Ea60Ee1d1de50ac' as `0x${string}`;
const BOOTSTRAP = '0x0000003eDf18913c01cBc482C978bBD3D6E8ffA3' as `0x${string}`;
const OWNER = '0xD0bAfa560e2EaC2e9Da80FBc3368bfcFdf3022B8' as `0x${string}`;

// Paste the FULL raw creation code of NexusProxy here (type(NexusProxy).creationCode):
const NEXUS_PROXY_CREATION_CODE_KNOWN: Hex =
  '0x60806040526102aa803803806100148161018c565b92833981016040828203126101885781516001600160a01b03811692909190838303610188576020810151906001600160401b03821161018857019281601f8501121561018857835161006e610069826101c5565b61018c565b9481865260208601936020838301011161018857815f926020809301865e8601015260017f90b772c2cb8a51aa7a8a65fc23543c6d022d5b3f8e2b92eed79fba7eef8293005d823b15610176577f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80546001600160a01b031916821790557fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b5f80a282511561015e575f8091610146945190845af43d15610156573d91610137610069846101c5565b9283523d5f602085013e6101e0565b505b604051606b908161023f8239f35b6060916101e0565b50505034156101485763b398979f60e01b5f5260045ffd5b634c9c8ce360e01b5f5260045260245ffd5b5f80fd5b6040519190601f01601f191682016001600160401b038111838210176101b157604052565b634e487b7160e01b5f52604160045260245ffd5b6001600160401b0381116101b157601f01601f191660200190565b9061020457508051156101f557805190602001fd5b63d6bda27560e01b5f5260045ffd5b81511580610235575b610215575090565b639996b31560e01b5f9081526001600160a01b0391909116600452602490fd5b50803b1561020d56fe60806040523615605c575f8073ffffffffffffffffffffffffffffffffffffffff7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5416368280378136915af43d5f803e156058573d5ff35b3d5ffd5b00fea164736f6c634300081b000a' as Hex;

// Golden expected outputs for index 0 with the above addresses:
const KNOWN_INITCODE_HASH =
  '0xa4ad8de61a8f6699670975af894743d63ce4a07166ca7c30f76304c9e81b059d' as const;
const KNOWN_ADDRESS = '0x2af6306aB61Fe114478d27eb5Efc7696813c8606' as const;

// Minimal arbitrary creation code for general behavior tests (any 0x-hex works off-chain)
const ANY_CREATION_CODE: Hex = '0x6001600055' as Hex; // PUSH1 0x01 ; PUSH1 0x00 ; SSTORE (arbitrary)

describe('Accounts > predictNexusOffchain', () => {
  it('defaults index to 0 when not provided', () => {
    // given
    const explicit0 = predictNexusOffchain({
      factory: FACTORY,
      implementation: IMPLEMENTATION,
      bootstrap: BOOTSTRAP,
      proxyCreationCode: ANY_CREATION_CODE,
      owner: OWNER,
      index: 0,
      log: false,
    });

    const implicit0 = predictNexusOffchain({
      factory: FACTORY,
      implementation: IMPLEMENTATION,
      bootstrap: BOOTSTRAP,
      proxyCreationCode: ANY_CREATION_CODE,
      owner: OWNER,
      log: false,
    });

    // then
    expect(implicit0.salt).toEqual(explicit0.salt);
    expect(implicit0.address.toLowerCase()).toEqual(
      explicit0.address.toLowerCase(),
    );
    expect(implicit0.initCodeHash).toEqual(explicit0.initCodeHash);
  });

  it('produces different addresses for different indices (salt changes)', () => {
    // given
    const idx0 = predictNexusOffchain({
      factory: FACTORY,
      implementation: IMPLEMENTATION,
      bootstrap: BOOTSTRAP,
      proxyCreationCode: ANY_CREATION_CODE,
      owner: OWNER,
      index: 0,
      log: false,
    });

    const idx1 = predictNexusOffchain({
      factory: FACTORY,
      implementation: IMPLEMENTATION,
      bootstrap: BOOTSTRAP,
      proxyCreationCode: ANY_CREATION_CODE,
      owner: OWNER,
      index: 1,
      log: false,
    });

    // then
    expect(idx0.salt).not.toEqual(idx1.salt);
    expect(idx0.address.toLowerCase()).not.toEqual(idx1.address.toLowerCase());

    // initCodeHash is keccak(initCode) and does NOT include the salt
    expect(idx0.initCodeHash).toEqual(idx1.initCodeHash);
  });

  it('changing owner alters initCodeHash and address for the same index', () => {
    const a = predictNexusOffchain({
      factory: FACTORY,
      implementation: IMPLEMENTATION,
      bootstrap: BOOTSTRAP,
      proxyCreationCode: ANY_CREATION_CODE,
      owner: OWNER,
      index: 0,
      log: false,
    });

    const b = predictNexusOffchain({
      factory: FACTORY,
      implementation: IMPLEMENTATION,
      bootstrap: BOOTSTRAP,
      proxyCreationCode: ANY_CREATION_CODE,
      owner: '0x0000000000000000000000000000000000000002',
      index: 0,
      log: false,
    });

    expect(a.initCodeHash).not.toEqual(b.initCodeHash);
    expect(a.address.toLowerCase()).not.toEqual(b.address.toLowerCase());
  });

  it('throws on invalid addresses', () => {
    // given bad factory
    expect(() =>
      predictNexusOffchain({
        factory: '0xdead' as `0x${string}`,
        implementation: IMPLEMENTATION,
        bootstrap: BOOTSTRAP,
        proxyCreationCode: ANY_CREATION_CODE,
        owner: OWNER,
        log: false,
      }),
    ).toThrow(/Bad address/i);
  });

  it('throws on non-0x proxy creation code', () => {
    // given bad creation code
    expect(() =>
      predictNexusOffchain({
        factory: FACTORY,
        implementation: IMPLEMENTATION,
        bootstrap: BOOTSTRAP,
        proxyCreationCode: 'deadbeef' as Hex,
        owner: OWNER,
        log: false,
      }),
    ).toThrow(/0x-prefixed/i);
  });

  it('reproduces the known Sophon testnet vector (paste creation code to enable)', () => {
    // Soft skip until the real creation code is embedded:
    if (
      NEXUS_PROXY_CREATION_CODE_KNOWN.length <= 2 ||
      NEXUS_PROXY_CREATION_CODE_KNOWN.includes('...')
    ) {
      // no-op assert so test suite stays green without the artifact
      expect(true).toBe(true);
      return;
    }

    const out = predictNexusOffchain({
      factory: FACTORY,
      implementation: IMPLEMENTATION,
      bootstrap: BOOTSTRAP,
      proxyCreationCode: NEXUS_PROXY_CREATION_CODE_KNOWN,
      owner: OWNER,
      index: 0,
      log: false,
    });

    expect(out.initCodeHash.toLowerCase()).toBe(KNOWN_INITCODE_HASH);
    expect(out.address.toLowerCase()).toBe(KNOWN_ADDRESS.toLowerCase());
  });
});
