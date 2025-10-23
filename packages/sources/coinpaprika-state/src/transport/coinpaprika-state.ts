import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes, inputParameters } from '../endpoint/coinpaprika-state'
import {
  PairRequest,
  SSEConnectionCallbacks,
  SSEConnectionConfig,
  SSEConnectionManager,
} from './sse-connection-manager'

const logger = makeLogger('CoinpaprikaStateTransport')

const COINPAPRIKA_STATE_EVENT_TYPE = 't_s'

type RequestParams = typeof inputParameters.validated

// Normal stream data (numbers may come as strings from API)
interface CoinpaprikaStreamData {
  block_time: string | number
  base_token_symbol: string
  quote_symbol: string
  volume_7d_usd: string | number
  market_depth_plus_1_usd: string | number
  market_depth_minus_1_usd: string | number
  state_price: string | number
}

export type TransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: Array<{ base: string; quote: string }>
    ResponseBody: CoinpaprikaStreamData
  }
}

/**
 * SSE transport that batches all pairs into one POST connection
 */
export class CoinpaprikaStateTransport extends StreamingTransport<TransportTypes> {
  name!: string
  responseCache!: ResponseCache<TransportTypes>
  requester!: Requester

  private connectionManager!: SSEConnectionManager
  private currentSubscriptions: RequestParams[] = []
  private subscriptionLookup: Map<string, RequestParams> = new Map()

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.connectionManager = new SSEConnectionManager(this.requester, COINPAPRIKA_STATE_EVENT_TYPE)
  }

  async streamHandler(
    context: EndpointContext<TransportTypes>,
    subscriptions: SubscriptionDeltas<TypeFromDefinition<TransportTypes['Parameters']>>,
  ): Promise<void> {
    if (
      subscriptions.new.length ||
      subscriptions.stale.length ||
      !this.connectionManager.connected
    ) {
      this.currentSubscriptions = subscriptions.desired

      // Update lookup map for O(1) access
      this.subscriptionLookup.clear()
      for (const sub of subscriptions.desired) {
        const key = `${sub.base.toUpperCase()}/${sub.quote.toUpperCase()}`
        this.subscriptionLookup.set(key, sub)
      }

      logger.debug(`Updating stream: ${this.currentSubscriptions.length} pairs`)
      await this.updateConnection(context, this.currentSubscriptions)
    }
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  private async updateConnection(
    context: EndpointContext<TransportTypes>,
    pairs: RequestParams[],
  ): Promise<void> {
    logger.debug(`updateConnection called with ${pairs.length} pairs`)

    if (pairs.length === 0) {
      logger.debug('No pairs, disconnecting')
      await this.connectionManager.disconnect()
      return
    }

    const pairRequests: PairRequest[] = pairs.map((p) => ({
      base: p.base,
      quote: p.quote,
    }))

    const config: SSEConnectionConfig = {
      apiEndpoint: context.adapterSettings.API_ENDPOINT,
      apiKey: context.adapterSettings.API_KEY,
      requestTimeoutMs: context.adapterSettings.REQUEST_TIMEOUT_MS,
    }

    const callbacks: SSEConnectionCallbacks = {
      onData: async (eventType: string, data: string) => {
        await this.handleSSEEvent(eventType, data)
      },
      onError: (error: Error) => {
        logger.error(`SSE stream error: ${error.message}`)
      },
      onConnectionError: async (status: number) => {
        await this.handleConnectionError(status)
      },
      onReconnectNeeded: () => {
        logger.info('SSE ended; will reconnect on next cycle')
      },
    }

    await this.connectionManager.connect(pairRequests, config, callbacks)
  }

  private async handleConnectionError(status: number): Promise<void> {
    // Map provider errors to appropriate adapter status codes
    let mappedStatus: number
    if (status >= 500) {
      // 5xx: Provider server error → 502 Bad Gateway
      mappedStatus = 502
    } else if (status === 429) {
      // 429: Rate limit → pass through (client should back off)
      mappedStatus = 429
    } else if (status === 400 || status === 401) {
      // 400/401: Client errors → pass through (client should fix)
      mappedStatus = status
    } else if (status === 403) {
      // 403: Permission issue → 502 (server config problem)
      mappedStatus = 502
    } else {
      // Other 4xx errors → 502 (likely config/setup issues)
      mappedStatus = 502
    }

    const errorMessage = `HTTP ${status} error from provider`

    const errorResponse: AdapterResponse<TransportTypes['Response']> = {
      statusCode: mappedStatus,
      errorMessage,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    for (const params of this.currentSubscriptions) {
      await this.responseCache.write(this.name, [{ params, response: errorResponse }])
    }
  }

  private async handleStreamError(errorData: string): Promise<void> {
    // Stream-level errors (e.g., "unsupported X-Y asset") don't affect all pairs
    // Just log the error - connection remains active for other pairs
    logger.warn(`Stream error received, continuing with other pairs: ${errorData}`)
  }

  private async handleStreamData(param: RequestParams, streamData: CoinpaprikaStreamData) {
    const statePrice = Number(streamData.state_price)
    const blockTime = Number(streamData.block_time)

    // guard against bad payloads
    if (!Number.isFinite(statePrice) || !Number.isFinite(blockTime) || blockTime <= 0) {
      logger.warn(
        `Bad numeric fields for ${param.base}/${param.quote}: ${JSON.stringify(streamData)}`,
      )
      return
    }

    const response: AdapterResponse<TransportTypes['Response']> = {
      statusCode: 200,
      result: statePrice,
      data: {
        result: statePrice,
      },
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: blockTime * 1000,
      },
    }
    logger.debug(`tick ${param.base}/${param.quote}=${statePrice} t=${blockTime}`)
    logger.trace('Response object:', response)

    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  private async handleSSEEvent(eventType: string, rawData: string): Promise<void> {
    // Handle explicit error events (stream-level errors)
    if (eventType === 'error') {
      logger.error(`SSE error event received: ${rawData}`)
      await this.handleStreamError(rawData)
      return
    }

    if (eventType !== COINPAPRIKA_STATE_EVENT_TYPE) {
      logger.debug(`Skipping event type: ${eventType}`)
      return
    }

    try {
      const streamData: CoinpaprikaStreamData = JSON.parse(rawData)

      // Fast O(1) lookup using pre-normalized keys
      const pairKey = `${streamData.base_token_symbol.toUpperCase()}/${streamData.quote_symbol.toUpperCase()}`
      const params = this.subscriptionLookup.get(pairKey)

      if (params) {
        await this.handleStreamData(params, streamData)
      } else {
        logger.warn(`Received data for untracked pair: ${pairKey}`)
      }
    } catch (err) {
      logger.debug(`Failed to parse SSE data: ${rawData} | Error: ${(err as Error).message}`)
    }
  }
}

export const coinpaprikaSubscriptionTransport = new CoinpaprikaStateTransport()
