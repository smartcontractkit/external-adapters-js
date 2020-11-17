import { ethers } from 'ethers'
import { AggregatorInterfaceFactory } from '@chainlink/contracts/ethers/v0.6/AggregatorInterfaceFactory'

export type ReferenceDataPrice = (
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
) => Promise<number>

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
  const rpcUrl = process.env.RPC_URL
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const aggregator = AggregatorInterfaceFactory.connect(contractAddress, provider)
  return (await aggregator.latestAnswer()).div(multiply).toNumber()
}
