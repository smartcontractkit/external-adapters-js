import { ethers } from 'ethers'
import { PriceExecute } from '.'
import { Config } from '../../config'
import { throwErrorForInvalidResult } from '../../utils'
import { anchorVaultAbi, curvePoolAbi } from './abi'

export const FROM = 'BETH'
export const INTERMEDIARY_TOKEN = 'ETH'

export const execute: PriceExecute = async (input, _, config, usdPerEth) => {
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const stEthPerBEth = await getStEthBEthExchangeRate(input.id, config, provider)
  const stEthPerETH = await getStETHExchangeRate(input.id, config, provider)
  // result = (USD / ETH) * (stETH / bETH) * (ETH / stETH) = USD / bETH
  return usdPerEth.mul(stEthPerBEth).div(stEthPerETH)
}

const getStETHExchangeRate = async (
  jobRunID: string,
  config: Config,
  provider: ethers.providers.JsonRpcProvider,
): Promise<ethers.BigNumber> => {
  const stEthPoolContract = new ethers.Contract(
    config.stEthPoolContractAddress,
    curvePoolAbi,
    provider,
  )
  const result = await stEthPoolContract.get_dy(1, 0, ethers.BigNumber.from(10).pow(18))
  throwErrorForInvalidResult(
    jobRunID,
    result,
    `stETH/ETH Exchange Rate from Curve Pool address ${config.stEthPoolContractAddress}`,
  )
  return result
}

const getStEthBEthExchangeRate = async (
  jobRunID: string,
  config: Config,
  provider: ethers.providers.JsonRpcProvider,
): Promise<ethers.BigNumber> => {
  const anchorVaultContract = new ethers.Contract(
    config.anchorVaultContractAddress,
    anchorVaultAbi,
    provider,
  )
  const result = await anchorVaultContract.get_rate()
  throwErrorForInvalidResult(
    jobRunID,
    result,
    `stETH/bETH Exchange Rate from Anchor Vault address ${config.anchorVaultContractAddress}`,
  )
  return result
}
