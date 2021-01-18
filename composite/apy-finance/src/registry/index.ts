import { ethers, utils } from 'ethers'
import registryAbi from '../abi/IRegistry.json'
import assetAllocationAbi from '../abi/IAssetAllocation.json'
import erc20Abi from '../abi/ERC20.json'

type GetDecimals = (address: string) => Promise<number>
type GetTokenDecimals = (provider: ethers.providers.JsonRpcProvider, abi: any) => GetDecimals

const getTokenDecimals: GetTokenDecimals = (provider, abi) => async (address) => {
  return await new ethers.Contract(address, abi, provider).decimals()
}

type Allocations = {
  components: string[]
  units: string[]
}

export type GetAllocations = (
  registry: ethers.Contract,
  getDecimals: GetDecimals,
) => () => Promise<Allocations>

const getAllocations: GetAllocations = (registry, getDecimals) => async () => {
  const tokenAddresses = await registry.getTokenAddresses()
  const [components, units, decimals]: string[][] = await Promise.all([
    Promise.all(tokenAddresses.map((address: string) => registry.symbolOf(address))),
    Promise.all(
      tokenAddresses.map(async (address: string) =>
        utils.bigNumberify(await registry.balanceOf(address)),
      ),
    ),
    Promise.all(tokenAddresses.map(async (address: string) => getDecimals(address))),
  ])

  return {
    components,
    units: units.map((unit, i) => {
      const decimal = new utils.BigNumber(10).pow(decimals[i])
      return new utils.BigNumber(unit).div(decimal).toString()
    }),
  }
}

type Registry = {
  getAllocations: () => Promise<Allocations>
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
    getAllocations: getAllocations(chainlinkRegistry, getTokenDecimals(provider, erc20Abi)),
  }
}

export default makeRegistry
