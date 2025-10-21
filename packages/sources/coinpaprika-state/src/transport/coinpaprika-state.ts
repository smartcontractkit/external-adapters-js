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
import { Readable } from 'node:stream'
import { BaseEndpointTypes, inputParameters } from '../endpoint/coinpaprika-state'
import { toNumber } from '../utils'
import { SSEParser } from './sse'

const logger = makeLogger('CoinpaprikaStateTransport')

const COINPAPRIKA_STATE_EVENT_TYPE = 't_s'

type RequestParams = typeof inputParameters.validated

// API returns numbers as strings, handle both types
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

  // single SSE conn for all pairs
  private isConnected = false
  private currentAbortController: AbortController | null = null
  private activePairs: Map<string, RequestParams> = new Map()
  private sseParser: SSEParser | null = null

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  async streamHandler(
    context: EndpointContext<TransportTypes>,
    subscriptions: SubscriptionDeltas<TypeFromDefinition<TransportTypes['Parameters']>>,
  ): Promise<void> {
    if (subscriptions.new.length || subscriptions.stale.length || !this.isConnected) {
      const currentPairs = new Map<string, RequestParams>()
      for (const sub of subscriptions.desired) {
        currentPairs.set(`${sub.base}/${sub.quote}`, sub)
      }

      logger.debug(`Updating stream: ${currentPairs.size} pairs`)
      await this.updateStream(context, currentPairs)
    }
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  private async updateStream(
    context: EndpointContext<TransportTypes>,
    pairs: Map<string, RequestParams>,
  ) {
    // close existing connection if any
    if (this.isConnected && this.currentAbortController) {
      logger.debug('Closing existing SSE connection')
      this.currentAbortController.abort()
      this.currentAbortController = null
      this.isConnected = false
    }
    // update active pairs
    this.activePairs = new Map(pairs)

    if (pairs.size === 0) {
      logger.debug('No pairs to stream')
      return
    }

    await this.createSSEConnection(context)
  }

  private buildSSERequest(
    context: EndpointContext<TransportTypes>,
    pairsArray: Array<{ base: string; quote: string }>,
    signal: AbortSignal,
  ): {
    url: string
    method: string
    headers: Record<string, string>
    data: Array<{ base: string; quote: string }>
    responseType: 'stream'
    signal: AbortSignal
    timeout: number
    validateStatus: () => boolean
  } {
    return {
      url: context.adapterSettings.API_ENDPOINT,
      method: 'POST',
      headers: {
        Authorization: context.adapterSettings.API_KEY,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      data: pairsArray,
      responseType: 'stream',
      signal,
      timeout: context.adapterSettings.REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    }
  }

  private async createSSEConnection(context: EndpointContext<TransportTypes>) {
    const pairsArray = Array.from(this.activePairs.values()).map((p) => ({
      base: p.base,
      quote: p.quote,
    }))

    logger.debug(
      `Opening SSE connection for ${pairsArray.length} pairs: ${pairsArray
        .map((p) => `${p.base}/${p.quote}`)
        .join(', ')}`,
    )

    this.currentAbortController = new AbortController()

    try {
      const req = this.buildSSERequest(context, pairsArray, this.currentAbortController.signal)
      const key = `coinpaprika-state/stream:${[...this.activePairs.keys()].join(',')}`
      const { response } = await this.requester.request<Readable>(key, req)
      const httpResp = response

      if (httpResp.status !== 200) {
        await this.handleSSEConnectionError(httpResp)
        return
      }

      if (!httpResp.data) {
        logger.error('No data in HTTP 200 response')
        await this.handleSSEConnectionError(httpResp)
        return
      }

      const stream: Readable = httpResp.data as Readable
      let aborted = false
      this.sseParser = new SSEParser(COINPAPRIKA_STATE_EVENT_TYPE)

      const onData = async (chunk: Buffer) => {
        const raw = chunk.toString('utf8')
        logger.debug(`Raw price state update message received:\n${raw}`)

        if (this.sseParser) {
          this.sseParser.push(raw, (evt, data) => {
            void this.handleParsedSSEEvent(evt, data)
          })
        }
      }

      const onError = (err: Error) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          aborted = true
        } else {
          logger.error(`Stream error: ${err}`)
        }
      }

      const onEnd = async () => {
        stream.off('data', onData)
        stream.off('error', onError)
        this.sseParser?.reset()

        // mark closed
        this.currentAbortController = null
        this.isConnected = false

        if (!aborted && this.activePairs.size > 0) {
          logger.info('SSE ended; will reconnect on next backgroundHandler cycle')
        }
      }

      // wire events
      stream.on('data', (chunk) => {
        void onData(chunk as Buffer)
      })
      stream.once('error', onError)
      stream.once('end', onEnd)

      // Mark as connected after successful setup
      this.isConnected = true
    } catch (error) {
      this.currentAbortController = null
      this.isConnected = false
      logger.error(`Failed to create SSE connection: ${error}`)
      return
    }
  }

  private async handleSSEConnectionError(httpResp: { status: number; data: any }): Promise<void> {
    // read error body
    let errDetail = `HTTP error! status: ${httpResp.status}`
    let rawErrBody = ''
    try {
      const text = await new Promise<string>((resolve) => {
        let buf = ''
        ;(httpResp.data as Readable)
          .on('data', (c: Buffer) => (buf += c.toString('utf8')))
          .on('end', () => resolve(buf))
          .on('error', () => resolve(''))
      })
      rawErrBody = text
      try {
        const j = JSON.parse(text)
        errDetail = `Provider error: ${JSON.stringify(j)}`
      } catch {
        logger.error(`Provider error body (not JSON): ${rawErrBody}`)
      }
    } catch (error) {
      logger.debug(`Failed to read error response body: ${(error as Error).message}`)
    }

    const mappedStatus = httpResp.status === 500 ? 502 : httpResp.status

    const errorResponse: AdapterResponse<TransportTypes['Response']> = {
      statusCode: mappedStatus,
      errorMessage: errDetail,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    for (const params of this.activePairs.values()) {
      await this.responseCache.write(this.name, [{ params, response: errorResponse }])
    }

    this.currentAbortController = null
    this.isConnected = false
  }

  private async handleSSEStreamError(errorData: string): Promise<void> {
    logger.error(`SSE stream error: ${errorData}`)

    const errorResponse: AdapterResponse<TransportTypes['Response']> = {
      statusCode: 502,
      errorMessage: `SSE stream error: ${errorData}`,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    // cache error for active pairs
    for (const params of this.activePairs.values()) {
      await this.responseCache.write(this.name, [{ params, response: errorResponse }])
    }

    // force reconnection
    if (this.currentAbortController) {
      this.currentAbortController.abort()
      this.currentAbortController = null
      this.isConnected = false
    }
  }

  private async handleStreamData(param: RequestParams, streamData: CoinpaprikaStreamData) {
    const statePrice = toNumber(streamData.state_price)
    const blockTime = toNumber(streamData.block_time)

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
    logger.trace(JSON.stringify(response))

    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  private async handleParsedSSEEvent(eventType: string, rawData: string): Promise<void> {
    // Handle explicit error events
    if (eventType === 'error') {
      logger.error(`SSE error event received: ${rawData}`)
      await this.handleSSEStreamError(rawData)
      return
    }

    if (eventType !== COINPAPRIKA_STATE_EVENT_TYPE) {
      logger.debug(`Skipping event type: ${eventType}`)
      return
    }

    try {
      const streamData: CoinpaprikaStreamData = JSON.parse(rawData)

      // Check for API error structure per documentation
      if ('error' in streamData || 'details' in streamData) {
        logger.error(`API error in stream data: ${rawData}`)
        await this.handleSSEStreamError(rawData)
        return
      }

      const pairKey = `${streamData.base_token_symbol.toUpperCase()}/${streamData.quote_symbol.toUpperCase()}`
      const params = this.activePairs.get(pairKey)
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
