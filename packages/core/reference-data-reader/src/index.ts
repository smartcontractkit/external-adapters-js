import { ethers } from 'ethers'
import { util, Logger, AdapterConfigError, AdapterDataProviderError } from '@chainlink/ea-bootstrap'
import abi from '@chainlink/contracts/abi/v0.8/AggregatorV2V3Interface.json'
import { BigNumber } from 'ethers/utils'

export interface RoundData {
  roundId: BigNumber
  answer: BigNumber
  startedAt: BigNumber
  updatedAt: BigNumber
  answeredInRound: BigNumber
}

export type ReferenceLatestPrice = (
  network: string,
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
  computeDecimals?: boolean,
) => Promise<number>

export type ReferenceLatestAnswer = (
  network: string,
  contractAddress: string,
  multiply: number,
  computeDecimals?: boolean,
) => Promise<number>

export type ReferenceDataRound = (network: string, contractAddress: string) => Promise<RoundData>

export const getLatestAnswer: ReferenceLatestPrice = async (
  network,
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
  computeDecimals?: boolean,
): Promise<number> => {
  if (!meta || !meta.latestAnswer)
    return getRpcLatestAnswer(network, contractAddress, multiply, computeDecimals)

  return (meta.latestAnswer as number) / multiply
}
export const getRpcLatestAnswer: ReferenceLatestAnswer = async (
  network,
  contractAddress: string,
  multiply: number,
  computeDecimals?: boolean,
): Promise<number> => {
  try {
    const rpcUrl = getRpcUrl(network)
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const aggregator = new ethers.Contract(contractAddress, abi, provider)
    const decimals = computeDecimals ? await aggregator.decimals() : 0
    return (await aggregator.latestAnswer())
      .div(multiply)
      .div(new BigNumber(10).pow(decimals))
      .toNumber()
  } catch (e: any) {
    throw new AdapterDataProviderError({
      network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}

export const getRpcLatestRound: ReferenceDataRound = async (
  network,
  contractAddress: string,
): Promise<RoundData> => {
  const rpcUrl = getRpcUrl(network)
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const aggregator = new ethers.Contract(contractAddress, abi, provider)
  return await aggregator.latestRoundData()
}

export const getRpcUrl = (network: string): string => {
  // First try with network prefix
  const rpcUrlWithNetwork = util.getEnv(`${network.toUpperCase()}_RPC_URL`)
  if (rpcUrlWithNetwork) return rpcUrlWithNetwork

  // Backwards compatability for RPC_URL
  const rpcURL = util.getEnv('RPC_URL')
  if (rpcURL) {
    Logger.warn(
      'Using the environment variable RPC_URL of an unknown network type. Multiple RPC URLs are now supported, please use only one instance of this adapter. Set the RPC_URLs with a prefix for the name of the network (e.g. ETHEREUM_RPC_URL).',
    )
    return rpcURL
  }

  throw new AdapterConfigError({
    message: `Network ${network} must be configured with an environment variable ${`${network.toUpperCase()}_RPC_URL`}`,
  })
}

export const isZeroAddress = (address: string): boolean => {
  const ZERO_ADDRESS = '0x' + '00'.repeat(20)
  return address === ZERO_ADDRESS
}
