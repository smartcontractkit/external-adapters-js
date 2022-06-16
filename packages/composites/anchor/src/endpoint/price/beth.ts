import { ethers } from 'ethers'
import { PriceExecute } from '.'
import { Config } from '../../config'
import { throwErrorForInvalidResult } from '../../utils'
import { anchorVaultAbi, curvePoolAbi } from './abi'
import { AdapterDataProviderError, util } from '../../../../../core/bootstrap'

export const FROM = 'BETH'
export const INTERMEDIARY_TOKEN = 'ETH'

/**
 * execute returns the USD/bETH price by performing a conversion between
 * several intermediate prices. The calculation is as follows:
 * result = (USD / ETH) * (ETH / stETH) / (bETH / stETH) = USD / bETH
 * @param input AdapterRequest
 * @param _ AdapterContext
 * @param config Config
 * @param usdPerEth ethers.BigNumber
 * @returns
 */
export const execute: PriceExecute = async (input, _, config, usdPerEth) => {
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  let ethPerStETH
  let bEthPerStETH
  try {
    ethPerStETH = await getEthStETHExchangeRate(input.id, config, provider)
    bEthPerStETH = await getBEthStETHExchangeRate(input.id, config, provider)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  return usdPerEth.mul(ethPerStETH).div(bEthPerStETH)
}

/**
 * getEthStETHExchangeRate returns a promise for the value of ETH/stETH
 * from the Curve ETH/stETH pool contract.
 * @param jobRunID string
 * @param config Config
 * @param provider ethers.providers.JsonRpcProvider
 * @returns Promise<ethers.BigNumber>
 */
const getEthStETHExchangeRate = async (
  jobRunID: string,
  config: Config,
  provider: ethers.providers.JsonRpcProvider,
): Promise<ethers.BigNumber> => {
  const stEthPoolContract = new ethers.Contract(
    config.stEthPoolContractAddress,
    curvePoolAbi,
    provider,
  )
  const baseTokenIndex = 1 // stETH has a token index of 1 in the curve pool
  const quoteTokenIndex = 0 // ETH has a token index of 0 in the curve pool

  // Gets how much ETH the pool will return if 1 stETH is traded.  The pool uses 18dp so 1 = 10**18.
  const result = await stEthPoolContract.get_dy(
    baseTokenIndex,
    quoteTokenIndex,
    ethers.BigNumber.from(10).pow(18),
  )
  throwErrorForInvalidResult(
    jobRunID,
    result,
    `stETH/ETH Exchange Rate from Curve Pool address ${config.stEthPoolContractAddress}`,
  )
  return result
}

/**
 * getBEthStETHExchangeRate returns a promise for the value of bEth/StETH
 * from the bEth/StETH Anchor Vault contract
 * @param jobRunID string
 * @param config Config
 * @param provider ethers.providers.JsonRpcProvider
 * @returns Promise<ethers.BigNumber>
 */
const getBEthStETHExchangeRate = async (
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
