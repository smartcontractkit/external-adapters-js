import { ethers } from 'ethers'

export const StaderSSVManager_ABI: ethers.ContractInterface = [
  {
    inputs: [],
    name: 'validatorCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'validatorsRegistry',
    outputs: [
      { internalType: 'bytes', name: 'pubKey', type: 'bytes' },
      { internalType: 'bool', name: 'registrationStatus', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
