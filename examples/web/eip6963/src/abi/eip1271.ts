export const EIP1271_ABI = [
  {
    inputs: [
      { name: "hash", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    name: "isValidSignature",
    outputs: [{ name: "", type: "bytes4" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
