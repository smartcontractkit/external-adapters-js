export const EC_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: 'uint16', name: 'traitId', type: 'uint16' },
      { internalType: 'uint16[]', name: '_ids', type: 'uint16[]' },
      { internalType: 'uint8[]', name: '_data', type: 'uint8[]' },
    ],
    name: 'setData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_addr', type: 'address' },
      { internalType: 'uint16', name: 'traitID', type: 'uint16' },
    ],
    name: 'addressCanModifyTrait',
    outputs: [{ internalType: 'bool', name: 'result', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
    name: 'traits',
    outputs: [
      { internalType: 'uint16', name: 'id', type: 'uint16' },
      { internalType: 'uint8', name: 'traitType', type: 'uint8' },
      { internalType: 'uint16', name: 'start', type: 'uint16' },
      { internalType: 'uint16', name: 'end', type: 'uint16' },
      { internalType: 'address', name: 'implementer', type: 'address' },
      { internalType: 'string', name: 'name', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const EC_REGISTRY_MAP_ABI = [
  {
    inputs: [],
    name: 'getPlayers',
    outputs: [
      {
        components: [
          { internalType: 'uint16', name: 'id', type: 'uint16' },
          { internalType: 'uint16', name: 'team_id', type: 'uint16' },
          { internalType: 'uint256', name: 'real_id', type: 'uint256' },
          { internalType: 'uint256', name: 'real_team_id', type: 'uint256' },
          { internalType: 'string', name: 'full_name', type: 'string' },
        ],
        internalType: 'struct ECRegistryMap.playerStruct[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTeams',
    outputs: [
      {
        components: [
          { internalType: 'uint16', name: 'id', type: 'uint16' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'city', type: 'string' },
          { internalType: 'string', name: 'tricode', type: 'string' },
          { internalType: 'uint256', name: 'real_id', type: 'uint256' },
        ],
        internalType: 'struct ECRegistryMap.teamStruct[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const TRAIT_IMPLEMENTER_ABI = [
  {
    inputs: [
      { internalType: 'uint16[]', name: '_tokenIds', type: 'uint16[]' },
      { internalType: 'uint8[]', name: '_value', type: 'uint8[]' },
    ],
    name: 'setData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

export const BATCH_WRITER_ABI = [
  {
    inputs: [{ internalType: 'uint16', name: 'id', type: 'uint16' }],
    name: 'CallFailed',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { indexed: true, internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'RequestFulfilled',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address', name: '_addr', type: 'address' }],
    name: 'canCall',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { internalType: 'bytes', name: 'bytesData', type: 'bytes' },
    ],
    name: 'fulfillBytes',
    outputs: [{ internalType: 'bool[]', name: '', type: 'bool[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'requestBytes',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
