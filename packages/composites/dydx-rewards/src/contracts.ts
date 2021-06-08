export const MerkleDistributorV1 = [
  {
    inputs: [],
    name: 'getActiveRoot',
    outputs: [
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'merkleRoot',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'ipfsCid',
            type: 'bytes',
          },
          {
            internalType: 'uint256',
            name: 'epoch',
            type: 'uint256',
          },
        ],
        internalType: 'struct sample.MerkleRoot',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    // TODO: Verify this function signature is correct
    inputs: [
      {
        internalType: 'bytes32',
        name: 'merkleRoot',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: 'ipfsCid',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'epoch',
        type: 'uint256',
      },
    ],
    name: 'proposeRoot',
    outputs: [],
    stateMutability: 'write', // TODO: Correct?
    type: 'function',
  },
]
