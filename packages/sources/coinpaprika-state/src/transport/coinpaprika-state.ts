import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes, inputParameters } from '../endpoint/coinpaprika-state'
import {
  SSEConnectionCallbacks,
  SSEConnectionConfig,
  SSEConnectionManager,
} from './sse-connection-manager'

const logger = makeLogger('CoinpaprikaStateTransport')

export const COINPAPRIKA_STATE_EVENT_TYPE = 't_s'

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
      logger.debug(`Updating stream: ${subscriptions.desired.length} pairs`)
      await this.updateConnection(context, subscriptions.desired)
    }
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  private async updateConnection(
    context: EndpointContext<TransportTypes>,
    pairs: RequestParams[],
  ): Promise<void> {
    logger.debug(`updateConnection called with ${pairs.length} pairs`)

    if (pairs.length === 0 && this.connectionManager.connected) {
      logger.debug('No pairs, disconnecting')
      // TODO: This could potentially block if the disconnect hangs
      await this.connectionManager.disconnect()
      return
    }

    const config: SSEConnectionConfig = {
      apiEndpoint: context.adapterSettings.API_ENDPOINT,
      apiKey: context.adapterSettings.API_KEY,
      requestTimeoutMs: context.adapterSettings.REQUEST_TIMEOUT_MS,
    }

    const callbacks: SSEConnectionCallbacks = {
      onData: async (eventType: string, data: string) => {
        await this.handleSSEEvent(eventType, data)
      },
      onError: async (error: Error) => {
        logger.error(`SSE stream error: ${error.message}`)
        await this.connectionManager.disconnect()
      },
      onConnectionError: async (status: number) => {
        logger.error(`SSE connection error with status: ${status}`)
      },
    }

    await this.connectionManager.connect(pairs, config, callbacks)
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  private async handleSSEEvent(eventType: string, rawData: string): Promise<void> {
    // Handle explicit error events (stream-level errors)
    if (eventType === 'error') {
      // Parse base and quote from raw data
      const data = JSON.parse(rawData)
      const match = data.message.match(/unsupported (\w+)-(\w+) asset/)
      if (!match) {
        logger.warn(`Got unexpected error: ${rawData}`)
        return
      }
      const [base, quote] = match.slice(1)
      logger.warn(`Received error for ${base}/${quote}: ${data.message}`)
      await this.responseCache.write(this.name, [
        {
          params: { base, quote },
          response: {
            statusCode: 400,
            errorMessage: data.message,
            timestamps: {
              providerDataRequestedUnixMs: Date.now(),
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
      return
    }

    if (eventType !== COINPAPRIKA_STATE_EVENT_TYPE) {
      logger.debug(`Skipping event type: ${eventType}`)
      return
    }

    // Parse incoming event
    const streamData: CoinpaprikaStreamData = JSON.parse(rawData)
    const param = {
      base: streamData.base_token_symbol.toUpperCase(),
      quote: streamData.quote_symbol.toUpperCase(),
    }
    const statePrice = Number(streamData.state_price)
    const blockTime = Number(streamData.block_time)

    // guard against bad payloads
    if (!Number.isFinite(statePrice) || !Number.isFinite(blockTime) || blockTime <= 0) {
      logger.warn(
        `Bad numeric fields for ${param.base}/${param.quote}: ${JSON.stringify(streamData)}`,
      )
      return
    }

    logger.debug(`tick ${param.base}/${param.quote}=${statePrice} t=${blockTime}`)
    await this.responseCache.write(this.name, [
      {
        params: param,
        response: {
          result: statePrice,
          data: {
            result: statePrice,
          },
          timestamps: {
            providerDataRequestedUnixMs: Date.now(),
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: blockTime * 1000,
          },
        },
      },
    ])
  }
}

export const coinpaprikaSubscriptionTransport = new CoinpaprikaStateTransport()
