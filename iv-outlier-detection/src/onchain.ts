import { ethers } from 'ethers'

export const getLatestAnswer = async (
  contractAddress: string,
  multiply: number,
  meta?: Record<string, unknown>,
): Promise<number> => {
  if (!meta || !meta.latestAnswer) return getRpcLatestAnswer(contractAddress, multiply)

  return (meta.latestAnswer as number) / multiply
}

const getRpcLatestAnswer = async (contractAddress: string, multiply: number): Promise<number> => {
  const rpcUrl = process.env.RPC_URL
  const ABI = ['function latestAnswer() external view returns (int256)']
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, ABI, provider)
  return (await contract.latestAnswer()) / multiply
}
