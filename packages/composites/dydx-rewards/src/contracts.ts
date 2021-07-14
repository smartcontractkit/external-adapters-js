export const OracleRequester = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'merkleRoot', type: 'bytes32' },
      { internalType: 'bytes', name: 'ipfsCid', type: 'bytes' },
      { internalType: 'uint256', name: 'epoch', type: 'uint256' },
    ],
    name: 'writeOracleData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
