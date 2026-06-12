import { Contract, JsonRpcProvider } from 'ethers'
import ABI from '../config/RobinhoodTokenABI.json'

export const getTokenData = async (tokenContractAddress: string, provider: JsonRpcProvider) => {
  const contract = new Contract(tokenContractAddress, ABI, provider)

  const [multiplier, paused] = await Promise.all([contract.uiMultiplier(), contract.oraclePaused()])

  return {
    multiplier: BigInt(multiplier),
    paused: Boolean(paused),
  }
}
