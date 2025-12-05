import { Contract, JsonRpcProvider } from 'ethers'
import ABI from '../config/ABI.json'

export const getRegistryData = async (
  asset: string,
  registry: string,
  provider: JsonRpcProvider,
) => {
  const registryContract = new Contract(registry, ABI, provider)

  const { sValue, paused } = await registryContract.getSValue(asset)

  return {
    multiplier: BigInt(sValue),
    paused: Boolean(paused),
  }
}
