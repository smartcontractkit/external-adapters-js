const ABI = {
  _format: 'hh-sol-artifact-1',
  contractName: 'INFC',
  sourceName: 'contracts/interfaces/INFC.sol',
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint32',
          name: 'tokenId',
          type: 'uint32',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'lastUpdated',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'bytes32',
          name: 'scorer',
          type: 'bytes32',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'tick',
          type: 'uint256',
        },
      ],
      name: 'ScoreUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'tickSetId',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256[]',
          name: 'tickEnds',
          type: 'uint256[]',
        },
      ],
      name: 'TickSetCreated',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'tokenHash',
          type: 'bytes32',
        },
      ],
      name: 'burnToken',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'tickSet',
          type: 'uint256',
        },
        {
          internalType: 'uint256[]',
          name: 'tickEnds',
          type: 'uint256[]',
        },
      ],
      name: 'createTickSet',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'depositLINK',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'tokenHash',
          type: 'bytes32',
        },
      ],
      name: 'getHashTokenId',
      outputs: [
        {
          internalType: 'uint32',
          name: '',
          type: 'uint32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint32',
          name: 'tokenId',
          type: 'uint32',
        },
      ],
      name: 'getOriginalOwner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint32',
          name: 'tokenId',
          type: 'uint32',
        },
        {
          internalType: 'uint256',
          name: 'tickSet',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'scorerId',
          type: 'bytes32',
        },
      ],
      name: 'getRequiredAmountForTickUpdate',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'scorer',
          type: 'bytes32',
        },
        {
          internalType: 'uint32',
          name: 'tokenId',
          type: 'uint32',
        },
        {
          internalType: 'uint256',
          name: 'tickSet',
          type: 'uint256',
        },
      ],
      name: 'getTick',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'ticksetId',
          type: 'uint256',
        },
      ],
      name: 'getTickSet',
      outputs: [
        {
          internalType: 'uint256[]',
          name: 'tickSet',
          type: 'uint256[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint32',
          name: 'tokenId',
          type: 'uint32',
        },
      ],
      name: 'isOriginalOwner',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'tokenHash',
          type: 'bytes32',
        },
        {
          internalType: 'uint256',
          name: 'tickSet',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'scorerId',
          type: 'bytes32',
        },
      ],
      name: 'mintToken',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint32',
          name: 'tokenId',
          type: 'uint32',
        },
        {
          internalType: 'uint256',
          name: 'tickSet',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'scorerId',
          type: 'bytes32',
        },
      ],
      name: 'updateHolderTick',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'withdrawETH',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'withdrawLINK',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
  bytecode: '0x',
  deployedBytecode: '0x',
  linkReferences: {},
  deployedLinkReferences: {},
}

export default ABI
