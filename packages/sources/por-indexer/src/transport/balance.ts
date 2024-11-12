import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'

export type TotalBalanceTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class TotalBalanceTransport extends SubscriptionTransport<TotalBalanceTransportTypes> {
  requester!: Requester
  config!: TotalBalanceTransportTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<TotalBalanceTransportTypes>,
    adapterSettings: TotalBalanceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.config = adapterSettings
    this.endpointName = endpointName
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const { minConfirmations, addresses } = params
    const porServiceRequests = new Map<string, string[]>()

    // Collect addresses into their respective PoR requests
    // Mapping from PoR ID to list of addresses
    for (const { network, chainId, address } of addresses) {
      const id = `${network}_${chainId}`.toUpperCase()
      const existingAddresses = porServiceRequests.get(id) || []
      porServiceRequests.set(id, [...existingAddresses, address])
    }

    // Fire off requests to each PoR indexer
    const requestResultPromises = []
    const providerDataRequestedUnixMs = Date.now()

    for (const [porId, addresses] of porServiceRequests.entries()) {
      const indexerEndpointEnvName = `${porId}_POR_INDEXER_URL` as keyof typeof this.config
      const indexerUrl = this.config[indexerEndpointEnvName] as string

      const requestResult = await this._makeRequest(indexerUrl, addresses, minConfirmations)

      requestResultPromises.push(requestResult)
    }

    // Sum up the total reserves from each PoR indexer
    const requestResults = await Promise.all(requestResultPromises)
    const summedTotalReserves = requestResults
      .map((requestResult) => {
        const totalReserves = new Decimal(requestResult.response.data.data.totalReserves)
        if (!totalReserves.isFinite() || totalReserves.isNaN()) {
          throw new AdapterError({
            message: `Invalid totalReserves answer: ${totalReserves.toString()}`,
          })
        }
        return totalReserves
      })
      .reduce((p, c) => p.add(c), new Decimal(0))
      .toString()

    return {
      data: {
        result: summedTotalReserves,
      },
      statusCode: 200,
      result: summedTotalReserves,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  private async _makeRequest(url: string, addresses: string[], minConfirmations: number) {
    const requestConfig = {
      method: 'post',
      baseURL: url,
      data: {
        id: '1',
        data: {
          addresses,
          minConfirmations,
        },
      },
    }
    return this.requester.request<{ data: { totalReserves: string } }>(
      calculateHttpRequestKey<TotalBalanceTransportTypes>({
        context: {
          adapterSettings: this.config,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: requestConfig.data,
        transportName: this.name,
      }),
      requestConfig,
    )
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const balanceTransport = new TotalBalanceTransport()
