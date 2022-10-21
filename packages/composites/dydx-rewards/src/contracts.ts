export const OracleRequester = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'merkleRoot', type: 'bytes32' },
      { internalType: 'uint256', name: 'epoch', type: 'uint256' },
      { internalType: 'bytes', name: 'ipfsCid', type: 'bytes' },
    ],
    name: 'writeOracleData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
