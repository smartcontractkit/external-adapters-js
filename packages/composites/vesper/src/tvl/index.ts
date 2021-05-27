import { ethers } from 'ethers'
import { types } from '@chainlink/token-allocation-adapter'

const controllerABI = [
  {
    inputs: [],
    name: 'pools',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
]

const addressListABI = [
  {
    inputs: [],
    name: 'length',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ type: 'uint256' }],
    name: 'at',
    outputs: [{ type: 'address' }, {type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]

const vTokenABI = [
  {
    inputs: [],
    name: 'token',
    outputs: [{ type:'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalValue',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]

const tokenABI = [
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
]

const getToken = async (tokenAddress: string, provider: ethers.providers.Provider) => {
  const token = new ethers.Contract(tokenAddress, tokenABI, provider)
  return {
    symbol: await token.symbol(),
    decimals: await token.decimals()
  }
}

const getTotalValue = async (vTokenAddress: string, provider: ethers.providers.Provider) => {
  const vToken = new ethers.Contract(vTokenAddress, vTokenABI, provider)
  const tokenAddress = await vToken.token() as string
  const token = await getToken(tokenAddress, provider)
  return {
    ...token,
    token: tokenAddress,
    balance: await vToken.totalValue() as ethers.BigNumber
  }
}

const getPoolValue = async (poolAddress: string, provider: ethers.providers.Provider) => {
  const pool = new ethers.Contract(poolAddress, addressListABI, provider)
  const listLength: ethers.BigNumber = await pool.length()

  const _getValue = async (index: number) => getTotalValue((await pool.at(index))[0], provider)
  const getValues = new Array(listLength.toNumber()).fill(0).map((_, i) => _getValue(i))
  return Promise.all(getValues)
}

export const getTokenAllocations = async (controllerAddress: string, provider: ethers.providers.Provider): Promise<types.TokenAllocations> => {
  const controller = new ethers.Contract(controllerAddress, controllerABI, provider)
  const pool = await controller.pools() as string

  const values = await getPoolValue(pool, provider)

  const tokens: { [token: string]: { symbol: string, decimals: number, balance: ethers.BigNumber } } = {}
  values.forEach(({ token, balance, symbol, decimals }) => {
    if (token in tokens) {
      tokens[token].balance = tokens[token].balance.add(balance)
    } else {
      tokens[token] = {
        symbol,
        decimals,
        balance
      }
    }
  })

  const _convertBigNumberish = (input: { symbol: string, decimals: number, balance: ethers.BigNumber }): types.TokenAllocation => ({
    ...input,
    balance: input.balance.toString()
  })

  return Object.keys(tokens).map(token => _convertBigNumberish(tokens[token]))
}
