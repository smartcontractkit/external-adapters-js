import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { BigNumber, ethers } from 'ethers'
import assetAllocationAbi from '../abi/IAssetAllocation.json'
import registryAbi from '../abi/IRegistry.json'
import { config } from '../config'
import { CompositeHttpTransport } from '../transports/composite-http'
import { Multicall } from '../utils/multicall'
import { TokenAllocation } from '@chainlink/token-allocation-test-adapter'

const logger = makeLogger('apy-finance-test allocations')

const inputParameters = new InputParameters({})

export type AllocationsResponse = {
  Data: TokenAllocation[]
  Result: null
}

type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: AllocationsResponse
  Settings: typeof config.settings
}

const compositeTransport = new CompositeHttpTransport<EndpointTypes>({
  performRequest: async (_params, settings, _requestHandler) => {
    const { RPC_URL, CHAIN_ID, REGISTRY_ADDRESS, MULTICALL_ADDRESS } = settings
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID)
    const registry = new ethers.Contract(REGISTRY_ADDRESS, registryAbi, provider)

    const providerDataRequested = Date.now()

    try {
      const chainlinkRegistryAddress = await registry.chainlinkRegistryAddress().catch((e: any) => {
        logger.error(
          `Failed to fetch Chainlink Registry address from Registry contract: ${REGISTRY_ADDRESS}, ${e}}`,
        )
        throw e
      })

      const chainlinkRegistry = new ethers.Contract(
        chainlinkRegistryAddress,
        assetAllocationAbi,
        provider,
      )

      const allocationIds: string[] = await chainlinkRegistry
        .getAssetAllocationIds()
        .catch((e: any) => {
          logger.error(
            `Failed to fetch asset allocation IDs from Chainlink Registry contract: ${chainlinkRegistryAddress}, ${e}`,
          )
          throw e
        })

      const multicall = new Multicall(MULTICALL_ADDRESS, provider)
      const symbols: string[] = await multicall.call(chainlinkRegistry, 'symbolOf', allocationIds)
      const balances: string[] = await multicall.call(chainlinkRegistry, 'balanceOf', allocationIds)
      const decimals: string[] = await multicall.call(
        chainlinkRegistry,
        'decimalsOf',
        allocationIds,
      )

      const allocations: TokenAllocation[] = allocationIds.map((_id, index) => ({
        symbol: symbols[index],
        balance: BigNumber.from(balances[index]).toString(),
        decimals: BigNumber.from(decimals[index]).toNumber(),
      }))

      return {
        params: {},
        response: {
          data: allocations,
          result: null,
          timestamps: {
            providerDataRequestedUnixMs: providerDataRequested,
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      }
    } catch (e) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          url: RPC_URL,
          cause: e,
        },
        {
          providerDataRequestedUnixMs: providerDataRequested,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'allocations',
  transport: compositeTransport,
  inputParameters: inputParameters,
})
