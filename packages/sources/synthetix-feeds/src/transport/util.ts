import { BigNumber, utils, ethers } from 'ethers'
import { Decimal } from 'decimal.js'
import StakedUSDeV2 from '../abi/StakedUSDeV2.json'
import EACAggregatorProxy from '../abi/EACAggregatorProxy.json'
import WstETH from '../abi/WstETH.json'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('synthetix-feeds-util')

const TEN = BigNumber.from(10)

export const getsUSDToUSD = async (
  sUSDeToUSDeAddress: string,
  USDeToUSDAddress: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Decimal> => {
  const v1 = await getsUSDeToUSDe(sUSDeToUSDeAddress, provider)
  const v2 = await getUSDeToUSD(USDeToUSDAddress, provider)
  const result = v1.times(v2)

  return result
}

const getsUSDeToUSDe = async (
  contractAddress: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Decimal> => {
  const contract = new ethers.Contract(contractAddress, StakedUSDeV2, provider)

  const decimals = BigNumber.from((await contract.decimals()).toString())
  const result = BigNumber.from(await contract.convertToAssets(TEN.pow(decimals).toString()))

  return new Decimal(utils.formatUnits(result, decimals).toString())
}

const getUSDeToUSD = async (
  contractAddress: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Decimal> => {
  const contract = new ethers.Contract(contractAddress, EACAggregatorProxy, provider)

  const decimals = BigNumber.from((await contract.decimals()).toString())
  const result = BigNumber.from((await contract.latestAnswer()).toString())
  const resultDecimal = new Decimal(utils.formatUnits(result, decimals).toString())

  if (resultDecimal > new Decimal(1)) {
    logger.warn(`USDe/USD price ${resultDecimal} is over $1, capping to $1`)
    return new Decimal(1)
  } else {
    return resultDecimal
  }
}

export const getwstETHToUSD = async (
  wstETHTostETHAddress: string,
  stETHToUSDAddress: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Decimal> => {
  const v1 = await getwstETHTostETH(wstETHTostETHAddress, provider)
  const v2 = await getstETHToUSD(stETHToUSDAddress, provider)
  const result = v1.times(v2)

  return result
}

const getwstETHTostETH = async (
  contractAddress: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Decimal> => {
  const contract = new ethers.Contract(contractAddress, WstETH, provider)

  const decimals = BigNumber.from((await contract.decimals()).toString())
  const result = BigNumber.from(await contract.getStETHByWstETH(TEN.pow(decimals).toString()))

  return new Decimal(utils.formatUnits(result, decimals).toString())
}

const getstETHToUSD = async (
  contractAddress: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Decimal> => {
  const contract = new ethers.Contract(contractAddress, EACAggregatorProxy, provider)

  const decimals = BigNumber.from((await contract.decimals()).toString())
  const result = BigNumber.from((await contract.latestAnswer()).toString())

  return new Decimal(utils.formatUnits(result, decimals).toString())
}
