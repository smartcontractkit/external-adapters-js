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
    name: 'balances',
    outputs: [{ type: 'uint256', name: '' }],
    inputs: [{ type: 'uint256', name: 'i' }],
    stateMutability: 'view',
    type: 'function',
  },
]
