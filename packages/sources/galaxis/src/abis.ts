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
  {
    inputs: [
      { internalType: 'uint16', name: 'traitId', type: 'uint16' },
      { internalType: 'uint8', name: '_page', type: 'uint8' },
      { internalType: 'uint16', name: '_perPage', type: 'uint16' },
    ],
    name: 'getData',
    outputs: [{ internalType: 'uint8[]', name: '', type: 'uint8[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'LastDate',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const EC_REGISTRY_MAP_ABI = [
  {
    inputs: [],
    name: 'playerCount',
    outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function',
  },
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
    inputs: [],
    name: 'LastDataRecordId',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'NeedsMoreProcessing',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
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
    inputs: [
      { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { internalType: 'bytes', name: 'bytesData', type: 'bytes' },
    ],
    name: 'estimate',
    outputs: [{ internalType: 'bool[]', name: '', type: 'bool[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
