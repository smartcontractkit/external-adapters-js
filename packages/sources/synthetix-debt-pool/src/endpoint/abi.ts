export const READ_PROXY_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'target',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export const ADDRESS_RESOLVER_ABI = [
  {
    constant: true,
    inputs: [{ internalType: 'bytes32', name: 'name', type: 'bytes32' }],
    name: 'getAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export const DEBT_CACHE_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'currentDebt',
    outputs: [
      { internalType: 'uint256', name: 'debt', type: 'uint256' },
      { internalType: 'bool', name: 'anyRateIsInvalid', type: 'bool' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export const DEBT_MIGRATOR_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'debtTransferReceived',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'debtTransferSent',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export const SYNTHETIX_DEBT_SHARE_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export const SYNTHETIX_BRIDGE_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'synthTransferReceived',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'synthTransferSent',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]
