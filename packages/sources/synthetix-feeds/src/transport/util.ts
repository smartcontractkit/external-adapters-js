import { BigNumber, utils, ethers } from 'ethers'
import { Decimal } from 'decimal.js'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import sUSDeUSDeAbi from '../abi/sUSDeUSDeAbi.json'
import USDeUSDAbi from '../abi/USDeUSDAbi.json'
import wstETHstETHAbi from '../abi/wstETHstETHAbi.json'
import stETHToUSDAbi from '../abi/stETHToUSDAbi.json'

const TEN = BigNumber.from(10)

const logger = makeLogger('SynthetixFeedsTransportUtil')

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
  const contract = new ethers.Contract(contractAddress, sUSDeUSDeAbi, provider)

  const decimals = BigNumber.from((await contract.decimals()).toString())
  const result = BigNumber.from(await contract.convertToAssets(TEN.pow(decimals).toString()))

  return new Decimal(utils.formatUnits(result, decimals).toString())
}

const getUSDeToUSD = async (
  contractAddress: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Decimal> => {
  const contract = new ethers.Contract(contractAddress, USDeUSDAbi, provider)

  const decimals = BigNumber.from((await contract.decimals()).toString())
  const result = BigNumber.from((await contract.latestAnswer()).toString())
  const decimalResult = new Decimal(utils.formatUnits(result, decimals).toString())

  if (decimalResult.cmp(1.0) === 1) {
    logger.warn(`USDe/USD market price ${decimalResult} exceeds 1, value replaced with 1`)
    return new Decimal(1.0)
  } else {
    return decimalResult
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
  const contract = new ethers.Contract(contractAddress, wstETHstETHAbi, provider)

  const decimals = BigNumber.from((await contract.decimals()).toString())
  const result = BigNumber.from(await contract.getStETHByWstETH(TEN.pow(decimals).toString()))

  return new Decimal(utils.formatUnits(result, decimals).toString())
}

const getstETHToUSD = async (
  contractAddress: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<Decimal> => {
  const contract = new ethers.Contract(contractAddress, stETHToUSDAbi, provider)

  const decimals = BigNumber.from((await contract.decimals()).toString())
  const result = BigNumber.from((await contract.latestAnswer()).toString())

  return new Decimal(utils.formatUnits(result, decimals).toString())
}
