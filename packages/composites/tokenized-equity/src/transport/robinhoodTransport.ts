import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { Smoother } from '../endpoint/common'
import { BaseEndpointTypes, inputParameters } from '../endpoint/robinhood'
import { calculatePrice } from './robinhoodPrice'

const logger = makeLogger('RobinhoodTransport')

type RequestParams = typeof inputParameters.validated

export class RobinhoodTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  config!: BaseEndpointTypes['Settings']
  dataEngineUrl!: string
  tradingHoursUrl!: string
  providerForNetwork: Record<string, JsonRpcProvider> = {}

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.config = adapterSettings
    this.dataEngineUrl = adapterSettings.DATA_ENGINE_ADAPTER_URL
    this.tradingHoursUrl = adapterSettings.TRADING_HOURS_ADAPTER_URL
  }
  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(dedupeParams(entries).map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let responses: Partial<Record<Smoother, AdapterResponse<BaseEndpointTypes['Response']>>>
    try {
      responses = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)

      const errorResponse = {
        statusCode: (e as AdapterError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
      responses =
        param.smoother === 'none'
          ? { none: errorResponse }
          : {
              ema: errorResponse,
              kalman: errorResponse,
            }
    }

    await this.responseCache.write(
      this.name,
      Object.entries(responses).map(([key, value]) => {
        return {
          params: {
            ...param,
            smoother: key as Smoother,
          },
          response: value,
        }
      }),
    )
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<Record<string, AdapterResponse<BaseEndpointTypes['Response']>>> {
    const providerDataRequestedUnixMs = Date.now()

    this.providerForNetwork[param.network] ??= new JsonRpcProvider(
      this.config.ROBINHOOD_NETWORK_RPC_URL.get(param.network),
      this.config.ROBINHOOD_NETWORK_CHAIN_ID.get(param.network),
    )

    const results = await calculatePrice({
      ...param,
      provider: this.providerForNetwork[param.network],
      url: this.dataEngineUrl,
      tradingHoursUrl: this.tradingHoursUrl,
      requester: this.requester,
    })

    return Object.fromEntries(
      results.map((r) => [
        r.smoother.smoother,
        {
          data: r,
          statusCode: 200,
          result: r.result,
          timestamps: {
            providerDataRequestedUnixMs,
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      ]),
    )
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}
const dedupeParams = (params: RequestParams[]) => {
  const seen = new Map<string, RequestParams>()
  for (const p of params) {
    const key = [
      p.asset,
      p.network,
      p.regularStreamId,
      p.extendedStreamId,
      p.overnightStreamId,
      p.overnightStreamMaxAgeInSeconds,
      p.sessionMarket,
      p.sessionMarketType,
      p.sessionBoundaries.join('|'),
      p.sessionBoundariesTimeZone,
      p.decimals,
    ].join('@@')
    if (!seen.has(key)) {
      seen.set(key, p)
    }
  }
  return Array.from(seen.values())
}

export const robinhoodTransport = new RobinhoodTransport()
