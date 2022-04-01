import { BigNumber, ethers } from 'ethers'
import registryAbi from '../abi/IRegistry.json'
import assetAllocationAbi from '../abi/IAssetAllocation.json'
import { types } from '@chainlink/token-allocation-adapter'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { BigNumberish } from 'ethers'

export const supportedEndpoints = ['allocations']

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

const getAllocations = async (registry: ethers.Contract): Promise<types.TokenAllocations> => {
  const allocationIds = await registry.getAssetAllocationIds()
  const [components, balances, decimals] = await Promise.all<string[], BigNumberish[], number[]>([
    Promise.all(allocationIds.map((id: string) => registry.symbolOf(id))),
    Promise.all(allocationIds.map((id: string) => registry.balanceOf(id))),
    Promise.all(allocationIds.map((id: string) => registry.decimalsOf(id))),
  ])

  return components.map((symbol, i) => ({
    symbol,
    balance: BigNumber.from(balances[i]).toString(),
    decimals: BigNumber.from(decimals[i]).toNumber(),
  }))
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator<TInputParameters>(input, inputParameters)

  const jobRunID = validator.validated.id

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const registry = new ethers.Contract(config.registryAddr, registryAbi, provider)
  const chainlinkRegistryAddress = await registry.chainlinkRegistryAddress()
  const chainlinkRegistry = new ethers.Contract(
    chainlinkRegistryAddress,
    assetAllocationAbi,
    provider,
  )

  const allocations = await getAllocations(chainlinkRegistry)
  const response = {
    data: allocations,
  }

  return Requester.success(jobRunID, response, true)
}
