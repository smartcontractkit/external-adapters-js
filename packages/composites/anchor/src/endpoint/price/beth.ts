import { ethers } from 'ethers'
import { PriceExecute } from '.'
import BigNumber from 'bignumber.js'
import { Config } from '../../config'
import { anchorVaultAbi, curvePoolAbi } from './abi'

export const FROM = 'BETH'
export const INTERMEDIARY_TOKEN_DECIMALS = 8
export const INTERMEDIARY_TOKEN = 'ETH'

export const execute: PriceExecute = async (input, _, config, taAdapterResponse) => {
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const stEthPerBEth = await getStEthBEthExchangeRate(config, provider)
  const ethPerStEth = await getStETHExchangeRate(config, provider)
  const usdPerEth = taAdapterResponse.data.result
  const result = new BigNumber(usdPerEth)
    .multipliedBy(ethPerStEth)
    .multipliedBy(stEthPerBEth)
    .toNumber()
  return {
    jobRunID: input.id,
    statusCode: 200,
    result,
    data: {
      result,
    },
  }
}

const getStETHExchangeRate = async (
  config: Config,
  provider: ethers.providers.JsonRpcProvider,
): Promise<BigNumber> => {
  const stEthPoolContract = new ethers.Contract(
    config.stEthPoolContractAddress,
    curvePoolAbi,
    provider,
  )
  const ethBal = await stEthPoolContract.balances(0)
  const stEthBal = await stEthPoolContract.balances(1)
  return new BigNumber(ethBal.toString()).dividedBy(new BigNumber(stEthBal.toString()))
}

const getStEthBEthExchangeRate = async (
  config: Config,
  provider: ethers.providers.JsonRpcProvider,
): Promise<BigNumber> => {
  const anchorVaultContract = new ethers.Contract(
    config.anchorVaultContractAddress,
    anchorVaultAbi,
    provider,
  )
  const bEthExchangeRateBigNum = await anchorVaultContract.get_rate()
  // Need to convert to BigNumber JS from ethers BigNumber as the latter will remove all decimals
  return new BigNumber(bEthExchangeRateBigNum.toString()).dividedBy(new BigNumber(10).pow(18))
}
