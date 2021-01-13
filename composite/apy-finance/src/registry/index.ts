import { ethers } from 'ethers'
import registryAbi from './IRegistry.json'
import assetAllocationAbi from './IAssetAllocation.json'

const getRegistry = (address: string, rpcUrl: string, abi: any): ethers.Contract => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  return new ethers.Contract(address, abi, provider)
}

type Allocations = {
  components: string[]
  units: string[]
}

export type GetAllocations = (registry: ethers.Contract) => () => Promise<Allocations>

const getAllocations: GetAllocations = (registry) => async () => {
  const tokenAddresses = await registry.getTokenAddresses()
  const components: string[] = await Promise.all(
    tokenAddresses.map(async (address: string) => await registry.symbolOf(address)),
  )
  const units: string[] = await Promise.all(
    tokenAddresses.map(async (address: string) => await registry.balanceOf(address)),
  )
  return { components, units }
}

type Registry = {
  getAllocations: () => Promise<Allocations>
}

const makeRegistry = async (address: string, rpcUrl: string): Promise<Registry> => {
  const registry = getRegistry(address, rpcUrl, registryAbi)
  const chainlinkRegistryAddress = await registry.chainlinkRegistryAddress()
  const chainlinkRegistry = getRegistry(chainlinkRegistryAddress, rpcUrl, assetAllocationAbi)

  return {
    getAllocations: getAllocations(chainlinkRegistry),
  }
}

export default makeRegistry
