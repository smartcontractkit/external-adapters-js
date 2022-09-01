import { ethers } from 'ethers'

export const SWNFTUpgrade_ABI: ethers.ContractInterface = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'validators',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'validatorsLength',
    outputs: [{ internalType: 'uint256', name: 'length', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]
