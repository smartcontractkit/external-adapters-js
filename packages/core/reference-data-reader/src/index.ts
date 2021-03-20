import { ethers } from 'ethers'
import { AggregatorInterfaceFactory } from '@chainlink/contracts/ethers/v0.6/AggregatorInterfaceFactory'
import { AggregatorV2V3InterfaceFactory } from '@chainlink/contracts/ethers/v0.6/AggregatorV2V3InterfaceFactory'
import { util } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers/utils'

export interface RoundData {
  roundId: BigNumber
  answer: BigNumber
  startedAt: BigNumber
  updatedAt: BigNumber
  answeredInRound: BigNumber
}

export type ReferenceDataPrice = (
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
) => Promise<number>

export type ReferenceDataRound = (contractAddress: string) => Promise<RoundData>

export const getLatestAnswer: ReferenceDataPrice = async (
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
): Promise<number> => {
  if (!meta || !meta.latestAnswer) return getRpcLatestAnswer(contractAddress, multiply)

  return (meta.latestAnswer as number) / multiply
}
export const getRpcLatestAnswer: ReferenceDataPrice = async (
  contractAddress: string,
  multiply: number,
): Promise<number> => {
  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const aggregator = AggregatorInterfaceFactory.connect(contractAddress, provider)
  return (await aggregator.latestAnswer()).div(multiply).toNumber()
}

export const getRpcLatestRound: ReferenceDataRound = async (
  contractAddress: string,
): Promise<RoundData> => {
  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const aggregator = AggregatorV2V3InterfaceFactory.connect(contractAddress, provider)
  return await aggregator.latestRoundData()
}
