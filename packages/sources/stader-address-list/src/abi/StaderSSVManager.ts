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
      { internalType: 'bytes', name: 'withdrawal_credentials', type: 'bytes' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
      { internalType: 'bytes32', name: 'deposit_data_root', type: 'bytes32' },
      { internalType: 'bool', name: 'registrationStatus', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
