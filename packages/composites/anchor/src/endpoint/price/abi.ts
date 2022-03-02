export const anchorVaultAbi = [
  {
    stateMutability: 'view',
    type: 'function',
    name: 'get_rate',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
]

export const curvePoolAbi = [
  {
    name: 'get_virtual_price',
    outputs: [{ type: 'uint256', name: '' }],
    inputs: [],
    stateMutability: 'view',
    type: 'function',
  },
]
