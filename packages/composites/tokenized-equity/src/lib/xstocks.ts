import { Contract, JsonRpcProvider, parseUnits } from 'ethers'
import ABI from '../config/XstocksWrappedBackedTokenABI.json'
import { MULTIPLIER_DECIMALS } from '../transport/xstocksPrice'

const unit = parseUnits('1', MULTIPLIER_DECIMALS)

export const getTokenMultiplier = async (
  tokenContractAddress: string,
  provider: JsonRpcProvider,
) => {
  const contract = new Contract(tokenContractAddress, ABI, provider)
  const multiplier = await contract.convertToAssets(unit)
  return BigInt(multiplier)
}
