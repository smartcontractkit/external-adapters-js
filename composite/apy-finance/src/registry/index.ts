import { BigNumber, ethers } from 'ethers'
import registryAbi from '../abi/IRegistry.json'
import assetAllocationAbi from '../abi/IAssetAllocation.json'
import { types } from '@chainlink/token-allocation-adapter'

export type GetAllocations = (registry: ethers.Contract) => () => Promise<types.TokenAllocations>

const getAllocations: GetAllocations = (registry) => async () => {
  const allocationIds = await registry.getAssetAllocationIds()
  const [components, balances, decimals]: any = await Promise.all([
    Promise.all(allocationIds.map((id: string) => registry.symbolOf(id))),
    Promise.all(allocationIds.map((id: string) => registry.balanceOf(id))),
    Promise.all(allocationIds.map((id: string) => registry.decimalsOf(id))),
  ])

  return components.map((symbol: string, i: number) => ({
    symbol,
    balance: BigNumber.from(balances[i]),
    decimals: decimals[i],
  }))
}

type Registry = {
  getAllocations: () => Promise<types.TokenAllocations>
}

const makeRegistry = async (address: string, rpcUrl: string): Promise<Registry> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const registry = new ethers.Contract(address, registryAbi, provider)
  const chainlinkRegistryAddress = await registry.chainlinkRegistryAddress()
  const chainlinkRegistry = new ethers.Contract(
    chainlinkRegistryAddress,
    assetAllocationAbi,
    provider,
  )

  return {
    getAllocations: getAllocations(chainlinkRegistry),
  }
}

export default makeRegistry
