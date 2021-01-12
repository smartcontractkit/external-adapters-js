import { ethers } from 'ethers'
import registryAbi from './IRegistry.json'
import assetAllocationAbi from './IAssetAllocation.json'

const getRegistry = (address: string, rpcUrl: string): ethers.Contract => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  return new ethers.Contract(address, registryAbi, provider)
}

const getChainlinkRegistry = (address: string, rpcUrl: string): ethers.Contract => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  return new ethers.Contract(address, assetAllocationAbi, provider)
}

type Allocations = {
  components: string[]
  units: string[]
}

export type GetAllocations = (registry: ethers.Contract) => () => Promise<Allocations>

const getAllocations: GetAllocations = (registry) => async () => {
  const tokenAddresses = await registry.getTokenAddresses()
  const allocations: Allocations = { components: [], units: [] }
  for (const address of tokenAddresses) {
    const balance = await registry.balanceOf(address)
    const symbol = await registry.symbolOf(address)
    allocations.components.push(symbol)
    allocations.units.push(balance)
  }
  return allocations
}

type Registry = {
  getAllocations: () => Promise<Allocations>
}

const makeRegistry = async (address: string, rpcUrl: string): Promise<Registry> => {
  const registry = getRegistry(address, rpcUrl)
  const chainlinkRegistryAddress = await registry.chainlinkRegistryAddress()
  const chainlinkRegistry = getChainlinkRegistry(chainlinkRegistryAddress, rpcUrl)

  return {
    getAllocations: getAllocations(chainlinkRegistry),
  }
}

export default makeRegistry
