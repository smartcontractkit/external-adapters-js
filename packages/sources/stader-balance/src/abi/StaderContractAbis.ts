import { ethers } from 'ethers'

export const StaderPoolFactoryContract_ABI: ethers.ContractInterface = [
  {
    inputs: [{ internalType: 'uint8', name: '_poolId', type: 'uint8' }],
    name: 'getCollateralETH',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint8', name: '_poolId', type: 'uint8' }],
    name: 'getOperatorFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint8', name: '_poolId', type: 'uint8' }],
    name: 'getProtocolFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPoolIdArray',
    outputs: [{ internalType: 'uint8[]', name: '', type: 'uint8[]' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const StaderConfigContract_ABI = [
  {
    inputs: [],
    name: 'getPenaltyContract',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPermissionedPool',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPoolUtils',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getStakePoolManager',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getStakedEthPerNode',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const DepositEvent_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes',
        name: 'pubkey',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'withdrawal_credentials',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'amount',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
      { indexed: false, internalType: 'bytes', name: 'index', type: 'bytes' },
    ],
    name: 'DepositEvent',
    type: 'event',
  },
]

export const StaderPenaltyContract_ABI: ethers.ContractInterface = [
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'totalPenaltyAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]
