import { ethers } from 'ethers'
import abi from '../config/abi.json'

export const btcToUSD = async (provider: ethers.JsonRpcProvider, contractAddress: string) => {
  const contract = new ethers.Contract(contractAddress, abi, provider)
  const [decimal, value]: [bigint, bigint] = await Promise.all([
    contract.decimals(),
    contract.latestAnswer(),
  ])

  return {
    value,
    decimal: Number(decimal),
  }
}
