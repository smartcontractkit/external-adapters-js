import { ethers } from 'ethers'

export const StaderConfigContract_ABI: ethers.ContractInterface = [
  {
    inputs: [],
    name: 'getPermissionlessNodeRegistry',
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
    name: 'getStaderOracle',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const StaderPoolFactoryContract_ABI: ethers.ContractInterface = [
  {
    inputs: [{ internalType: 'uint8', name: '_poolId', type: 'uint8' }],
    name: 'getNodeRegistry',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
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
  {
    inputs: [{ internalType: 'uint8', name: '_poolId', type: 'uint8' }],
    name: 'getSocializingPoolAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const StaderNodeRegistryContract_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_pageNumber', type: 'uint256' },
      { internalType: 'uint256', name: '_pageSize', type: 'uint256' },
    ],
    name: 'getAllActiveValidators',
    outputs: [
      {
        components: [
          { internalType: 'enum ValidatorStatus', name: 'status', type: 'uint8' },
          { internalType: 'bytes', name: 'pubkey', type: 'bytes' },
          { internalType: 'bytes', name: 'preDepositSignature', type: 'bytes' },
          { internalType: 'bytes', name: 'depositSignature', type: 'bytes' },
          { internalType: 'address', name: 'withdrawVaultAddress', type: 'address' },
          { internalType: 'uint256', name: 'operatorId', type: 'uint256' },
          { internalType: 'uint256', name: 'depositBlock', type: 'uint256' },
          { internalType: 'uint256', name: 'withdrawnBlock', type: 'uint256' },
        ],
        internalType: 'struct Validator[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextValidatorId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const StaderPermissionlessNodeRegistryContract_ABI: ethers.ContractInterface = [
  {
    inputs: [
      { internalType: 'uint256', name: '_pageNumber', type: 'uint256' },
      { internalType: 'uint256', name: '_pageSize', type: 'uint256' },
    ],
    name: 'getNodeELVaultAddressForOptOutOperators',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextOperatorId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const StaderOracle_ABI: ethers.ContractInterface = [
  {
    inputs: [],
    name: 'getERReportableBlock',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

//test change
