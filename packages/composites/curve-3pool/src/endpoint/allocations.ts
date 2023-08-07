import { BigNumber, ethers } from 'ethers'
import stableSwap3PoolAbi from '../abi/StableSwap3Pool.json'
import lpTokenAbi from '../abi/LpToken.json'
import { types } from '@chainlink/token-allocation-adapter'
import type { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { BigNumberish } from 'ethers'

export const supportedEndpoints = ['allocations']

const POOL_ADDRESS = '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
const LP_TOKEN_ADDRESS = '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490'

const getAllocations = async (
  pool: ethers.Contract,
  lpToken: ethers.Contract,
): Promise<types.TokenAllocations> => {
  const components = ['DAI', 'USDC', 'USDT']
  const decPads = [18, 6, 6].map((d) => 18 - d) // used to pad balances to 18 decimals

  const lpTotalSupply = await lpToken.totalSupply()
  let balances = await Promise.all<BigNumberish>([
    pool.balances(0),
    pool.balances(1),
    pool.balances(2),
  ])
  balances = balances.map((b, i) =>
    BigNumber.from(10)
      .pow(18 + decPads[i])
      .mul(b)
      .div(lpTotalSupply),
  )

  return components.map((symbol, i) => ({
    symbol,
    balance: BigNumber.from(balances[i]).toString(),
    decimals: 18,
  }))
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, {})

  const jobRunID = validator.validated.id

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl, config.chainId)
  const pool = new ethers.Contract(POOL_ADDRESS, stableSwap3PoolAbi, provider)
  const lpToken = new ethers.Contract(LP_TOKEN_ADDRESS, lpTokenAbi, provider)

  const allocations = await getAllocations(pool, lpToken)
  const response = {
    data: allocations,
  }

  return Requester.success(jobRunID, response, true)
}
