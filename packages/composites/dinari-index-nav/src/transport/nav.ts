import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import { BaseEndpointTypes } from '../endpoint/nav'
import {
  Allocation,
  TokenAllocationResponse,
  buildAllocation,
  buildEmptyAllocationsResponse,
  buildErrorResponse,
  buildSuccessResponse,
  buildTokenAllocationRequest,
  parseTokenAllocationResult,
} from './utils'

const logger = makeLogger('DinariIndexNav')

type RequestParams = Record<string, never>

export type NavTransportTypes = BaseEndpointTypes

const INDEX_ABI = [
  {
    inputs: [],
    name: 'getAllocations',
    outputs: [
      { internalType: 'address[]', name: '', type: 'address[]' },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export class NavTransport extends SubscriptionTransport<NavTransportTypes> {
  name!: string
  responseCache!: ResponseCache<NavTransportTypes>
  requester!: Requester
  settings!: NavTransportTypes['Settings']
  private provider!: ethers.providers.JsonRpcProvider
  private indexContract!: ethers.Contract

  async initialize(
    dependencies: TransportDependencies<NavTransportTypes>,
    adapterSettings: NavTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.provider = new ethers.providers.JsonRpcProvider(
      this.settings.DINARI_RPC_URL,
      this.settings.DINARI_CHAIN_ID,
    )
    this.indexContract = new ethers.Contract(
      this.settings.INDEX_CONTRACT_ADDRESS,
      INDEX_ABI,
      this.provider,
    )
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, _entries: RequestParams[]) {
    // Since this adapter uses EmptyInputParameters, there's only one unique subscription: {}
    await this.handleRequest({})
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = buildErrorResponse(errorMessage)
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(): Promise<AdapterResponse<NavTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const allocations = await this.fetchAllocations(providerDataRequestedUnixMs)
    logger.debug(`Fetched ${allocations.length} allocations from index contract`)

    if (allocations.length === 0) {
      logger.warn('Index contract returned empty allocations - returning 0 value')
      return buildEmptyAllocationsResponse(providerDataRequestedUnixMs)
    }

    const indexValue = await this.calculateIndexValue(allocations, providerDataRequestedUnixMs)

    return buildSuccessResponse(indexValue, providerDataRequestedUnixMs)
  }

  private async fetchAllocations(providerDataRequestedUnixMs: number): Promise<Allocation[]> {
    try {
      const [addresses, balances]: [string[], ethers.BigNumber[]] =
        await this.indexContract.getAllocations()

      const allocations = await Promise.all(
        addresses.map(async (address, i) => {
          const tokenContract = new ethers.Contract(address, ERC20_ABI, this.provider)
          const [symbol, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals(),
          ])

          return buildAllocation(symbol as string, decimals as number, balances[i].toString())
        }),
      )

      return allocations
    } catch (e) {
      const error = e as Error
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Failed to fetch allocations from index contract: ${error.message}`,
        },
        {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
  }

  private async calculateIndexValue(
    allocations: Allocation[],
    dataRequestedTimestamp: number,
  ): Promise<number> {
    const requestConfig = buildTokenAllocationRequest(
      this.settings.TOKEN_ALLOCATION_ADAPTER_URL,
      allocations,
      this.settings.TOKEN_ALLOCATION_SOURCE,
    )

    try {
      const response = await this.requester.request<TokenAllocationResponse>(
        JSON.stringify(requestConfig),
        requestConfig,
      )

      const result = response.response.data.result
      return parseTokenAllocationResult(result)
    } catch (e) {
      const error = e as Error
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Failed to calculate index value from token-allocation adapter: ${error.message}`,
        },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const navTransport = new NavTransport()
