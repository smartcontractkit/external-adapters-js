import { ethers } from 'ethers'
import { PriceExecute } from '.'
import { Config } from '../../config'
import { anchorVaultAbi, curvePoolAbi } from './abi'

export const FROM = 'BETH'
export const INTERMEDIARY_TOKEN_DECIMALS = 18
export const INTERMEDIARY_TOKEN = 'ETH'

export const execute: PriceExecute = async (_, __, config, usdPerEth) => {
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const stEthPerBEth = await getStEthBEthExchangeRate(config, provider)
  const stEthPerETH = await getStETHExchangeRate(config, provider)
  // result = USD / ETH * stETH / bETH * ETH / stETH = USD / bETH
  return usdPerEth.mul(stEthPerBEth).div(stEthPerETH)
}

const getStETHExchangeRate = async (
  config: Config,
  provider: ethers.providers.JsonRpcProvider,
): Promise<ethers.BigNumber> => {
  const stEthPoolContract = new ethers.Contract(
    config.stEthPoolContractAddress,
    curvePoolAbi,
    provider,
  )
  return stEthPoolContract.get_virtual_price()
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
