import { ethers, utils } from 'ethers'
import registryAbi from '../abi/IRegistry.json'
import assetAllocationAbi from '../abi/IAssetAllocation.json'
import erc20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import { types } from '@chainlink/token-allocation-adapter'

export type GetAllocations = (
  registry: ethers.Contract,
  decimalsOf: (address: string) => Promise<number>,
) => () => Promise<types.TokenAllocations>

const getAllocations: GetAllocations = (registry, decimalsOf) => async () => {
  const tokenAddresses = await registry.getTokenAddresses()
  const [components, balances, decimals]: any = await Promise.all([
    Promise.all(tokenAddresses.map((address: string) => registry.symbolOf(address))),
    Promise.all(tokenAddresses.map((address: string) => registry.balanceOf(address))),
    Promise.all(tokenAddresses.map(async (address: string) => decimalsOf(address))),
  ])

  return components.map((symbol: string, i: number) => ({
    symbol,
    balance: utils.bigNumberify(balances[i]),
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

  const _getERC20 = (address: string) => new ethers.Contract(address, erc20.abi, provider)
  const _decimalsOf = (address: string) => _getERC20(address).decimals()

  return {
    getAllocations: getAllocations(chainlinkRegistry, _decimalsOf),
  }
}

export default makeRegistry
