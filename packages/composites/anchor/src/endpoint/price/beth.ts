import { BigNumber, ethers } from 'ethers'
import { PriceExecute } from '.'
import { Config, FIXED_POINT_DECIMALS } from '../../config'
import { anchorVaultAbi, curvePoolAbi } from './abi'

export const FROM = 'BETH'
export const INTERMEDIARY_TOKEN_DECIMALS = 18
export const INTERMEDIARY_TOKEN = 'ETH'

export const execute: PriceExecute = async (_, __, config, usdPerEth) => {
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const stEthPerBEth = await getStEthBEthExchangeRate(config, provider)
  const { ethBalance, stEthBalance } = await getStETHExchangeRate(config, provider)
  // result = USD / ETH * ETH / stETH * stETH / bETH = USD / bETH
  return usdPerEth
    .mul(stEthPerBEth)
    .mul(ethBalance)
    .div(stEthBalance)
    .div(BigNumber.from(10).pow(FIXED_POINT_DECIMALS))
}

interface CurveEthStEthBalances {
  ethBalance: ethers.BigNumber
  stEthBalance: ethers.BigNumber
}

const getStETHExchangeRate = async (
  config: Config,
  provider: ethers.providers.JsonRpcProvider,
): Promise<CurveEthStEthBalances> => {
  const stEthPoolContract = new ethers.Contract(
    config.stEthPoolContractAddress,
    curvePoolAbi,
    provider,
  )
  const ethBal = await stEthPoolContract.balances(0)
  const stEthBal = await stEthPoolContract.balances(1)
  return {
    ethBalance: ethBal,
    stEthBalance: stEthBal,
  }
}

const getStEthBEthExchangeRate = async (
  config: Config,
  provider: ethers.providers.JsonRpcProvider,
): Promise<ethers.BigNumber> => {
  const anchorVaultContract = new ethers.Contract(
    config.anchorVaultContractAddress,
    anchorVaultAbi,
    provider,
  )
  return await anchorVaultContract.get_rate()
}
