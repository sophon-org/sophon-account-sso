import {
  zksyncSepoliaTestnet,
  zksyncInMemoryNode,
  sophonTestnet,
  sophon,
} from "viem/chains";

export const CHAIN_CONTRACTS = {
  [zksyncSepoliaTestnet.id]: {
    session: "0x64Fa4b6fCF655024e6d540E0dFcA4142107D4fBC",
    passkey: "0x006ecc2D79242F1986b7cb5F636d6E3f499f1026",
    accountFactory: "0xd122999B15081d90b175C81B8a4a9bE3327C0c2a",
    accountPaymaster: "0x4Cb1C15710366b73f3D31EC2b3092d5f3BFD8504",
    recovery: "0x6AA83E35439D71F28273Df396BC7768dbaA9849D",
  },
  [sophonTestnet.id]: {
    session: "0x3E9AEF9331C4c558227542D9393a685E414165a3",
    passkey: "0xA00d13Be54c485a8A7B02a01067a9F257A614074",
    accountFactory: "0x9Bb2603866dD254d4065E5BA50f15F8F058F600E",
    accountPaymaster: "0x98546B226dbbA8230cf620635a1e4ab01F6A99B2",
    recovery: "0x4c15F20fb91Fb90d2ba204194E312b595F75709F",
  },
  [sophon.id]: {
    session: "0x3E9AEF9331C4c558227542D9393a685E414165a3",
    passkey: "0xA00d13Be54c485a8A7B02a01067a9F257A614074",
    accountFactory: "0x9Bb2603866dD254d4065E5BA50f15F8F058F600E",
    accountPaymaster: "0x0000000000000000000000000000000000000000",
    recovery: "0x4c15F20fb91Fb90d2ba204194E312b595F75709F",
  },
  [zksyncInMemoryNode.id]: {
    accountFactory: "0x940adFE6B30536D22eD78870aA79c9DC0835556C",
    passkey: "0xDdB1e5ECd29aAC588E0fb0a7eAB1b589fE7D7dcD",
    session: "0xcc8bD0d99CF35e5F07d5FbbFd8f7B628010E52C2",
    recovery: "0xE797B5A28B73925250e70e4077568bF3a4CDc240",
    accountPaymaster: "0x025A31E05306E1Db13D1F54581f6C729BE284Fd4",
  },
};

export const DEFAULT_CHAIN_ID = sophonTestnet.id;
