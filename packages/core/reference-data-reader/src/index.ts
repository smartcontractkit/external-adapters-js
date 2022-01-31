import { ethers } from 'ethers'
import { AggregatorInterfaceFactory } from '@chainlink/contracts/ethers/v0.6/AggregatorInterfaceFactory'
import { AggregatorV2V3InterfaceFactory } from '@chainlink/contracts/ethers/v0.6/AggregatorV2V3InterfaceFactory'
import { util, Logger } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers/utils'

export interface RoundData {
  roundId: BigNumber
  answer: BigNumber
  startedAt: BigNumber
  updatedAt: BigNumber
  answeredInRound: BigNumber
}

export type ReferenceDataPrice = (
  network: string,
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
) => Promise<number>

export type ReferenceDataRound = (network: string, contractAddress: string) => Promise<RoundData>

export const getLatestAnswer: ReferenceDataPrice = async (
  network,
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
): Promise<number> => {
  if (!meta || !meta.latestAnswer) return getRpcLatestAnswer(network, contractAddress, multiply)

  return (meta.latestAnswer as number) / multiply
}
export const getRpcLatestAnswer: ReferenceDataPrice = async (
  network,
  contractAddress: string,
  multiply: number,
): Promise<number> => {
  const rpcUrl = getRpcUrl(network)
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const aggregator = AggregatorInterfaceFactory.connect(contractAddress, provider)
  return (await aggregator.latestAnswer()).div(multiply).toNumber()
}

export const getRpcLatestRound: ReferenceDataRound = async (
  network,
  contractAddress: string,
): Promise<RoundData> => {
  const rpcUrl = getRpcUrl(network)
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const aggregator = AggregatorV2V3InterfaceFactory.connect(contractAddress, provider)
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

  throw new Error(
    `Network ${network} must be configured with an environment variable ${`${network.toUpperCase()}_RPC_URL`}`,
  )
}

export const isZeroAddress = (address: string): boolean => {
  const ZERO_ADDRESS = '0x' + '00'.repeat(20)
  return address === ZERO_ADDRESS
}
