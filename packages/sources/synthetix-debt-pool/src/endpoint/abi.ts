// Contract addresses https://docs.synthetix.io/addresses/

export const DEBT_POOL_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'currentDebt',
    outputs: [
      {
        internalType: 'uint256',
        name: 'debt',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'anyRateIsInvalid',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalNonSnxBackedDebt',
    outputs: [
      { internalType: 'uint256', name: 'excludedDebt', type: 'uint256' },
      { internalType: 'bool', name: 'isInvalid', type: 'bool' },
    ],
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

export const ADDRESS_PROVIDER_ABI = [
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
