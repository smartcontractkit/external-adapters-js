import { ethers } from 'ethers'
import { PriceExecute } from '.'
import { Config } from '../../config'
import { throwErrorForInvalidResult } from '../../utils'
import { anchorVaultAbi, curvePoolAbi } from './abi'

export const FROM = 'BETH'
export const INTERMEDIARY_TOKEN = 'ETH'

/**
 * execute returns the USD/bETH price by performing a conversion between
 * several intermediate prices. The calculation is as follows:
 * result = (USD / ETH) * (stETH / bETH) * (ETH / stETH) = USD / bETH
 * @param input AdapterRequest
 * @param _ AdapterContext
 * @param config Config
 * @param usdPerEth ethers.BigNumber
 * @returns
 */
export const execute: PriceExecute = async (input, _, config, usdPerEth) => {
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const stEthPerBEth = await getStEthBEthExchangeRate(input.id, config, provider)
  const stEthPerETH = await getStETHExchangeRate(input.id, config, provider)
  return usdPerEth.mul(stEthPerBEth).div(stEthPerETH)
}

/**
 * getStETHExchangeRate returns a promise for the value of stETH/ETH
 * from the Curve stETH/ETH pool contract.
 * @param jobRunID string
 * @param config Config
 * @param provider ethers.providers.JsonRpcProvider
 * @returns Promise<ethers.BigNumber>
 */
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

/**
 * getStEthBEthExchangeRate returns a promise for the value of stETH/bETH
 * from the stETH/bETH Anchor Vault contract
 * @param jobRunID string
 * @param config Config
 * @param provider ethers.providers.JsonRpcProvider
 * @returns Promise<ethers.BigNumber>
 */
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
