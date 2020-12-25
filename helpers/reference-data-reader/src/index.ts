import { ethers } from 'ethers'
import { AggregatorInterfaceFactory } from '@chainlink/contracts/ethers/v0.6/AggregatorInterfaceFactory'
import { util } from '@chainlink/ea-bootstrap'

export type ReferenceDataPrice = (
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
) => Promise<number>

export type ReferenceDataRound = (contractAddress: string, multiply: number) => Promise<RoundData>

export type RoundData = {
  roundId: number
  answer: number
  startedAt: number
  updatedAt: number
  answeredInRound: number
}

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
  multiply: number,
): Promise<RoundData> => {
  const rpcUrl = process.env.RPC_URL
  const ABI = [
    'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  ]
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, ABI, provider)
  const result = await contract.latestRoundData()
  result.answer = result.answer / multiply
  result.startedAt = Number(result.startedAt)
  result.updatedAt = Number(result.updatedAt)
  result.answeredInRound = Number(result.answeredInRound)
  result.roundId = Number(result.roundId)
  return result
}
