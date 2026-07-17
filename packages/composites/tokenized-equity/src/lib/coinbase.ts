import { Contract, JsonRpcProvider } from 'ethers'
import ABI from '../config/CoinbaseOracleRegistryABI.json'

export const getRegistryData = async (
  asset: string,
  registry: string,
  provider: JsonRpcProvider,
) => {
  const registryContract = new Contract(registry, ABI, provider)

  const { multiplier, paused } = await registryContract.getOracleParams(asset)

  return {
    multiplier: BigInt(multiplier),
    paused: Boolean(paused),
  }
}
