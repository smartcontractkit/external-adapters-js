import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { Readable } from 'node:stream'
import { BaseEndpointTypes, inputParameters } from '../endpoint/coinpaprika-state'
import { toNumber } from '../utils'
import { SSEParser } from './sse'

const logger = makeLogger('CoinpaprikaStateTransport')

const COINPAPRIKA_STATE_EVENT_TYPE = 't_s'

type RequestParams = typeof inputParameters.validated

// Type union string | number is intentional for defensive programming.
// Coinpaprika documentation indicates numeric values are encoded as strings,
// but this union handles both cases to ensure robustness.
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
 * Single-connection SSE transport that batches all pairs into one POST and streams state_price ticks into the cache.
 *
 * */
export class CoinpaprikaStateTransport extends SubscriptionTransport<TransportTypes> {
  name!: string
  responseCache!: ResponseCache<TransportTypes>
  requester!: Requester

  // single SSE conn for all pairs
  private isConnected = false
  private currentAbortController: AbortController | null = null
  private activePairs: Map<string, RequestParams> = new Map()
  // reconnection backoff base (ms); jitter added per attempt
  private lastConnectionAttempt!: number
  private reconnectDelay!: number
  private sseParser: SSEParser | null = null

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.reconnectDelay = adapterSettings.RECONNECT_DELAY_MS
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  async backgroundHandler(context: EndpointContext<TransportTypes>, entries: RequestParams[]) {
    // build current pairs map
    const currentPairs = new Map<string, RequestParams>()
    for (const e of entries) {
      currentPairs.set(`${e.base}/${e.quote}`, e)
    }

    // detect changes in the requested pair set (triggers reconnect if changed)
    if (this.havePairsChanged(currentPairs) || !this.isConnected) {
      logger.debug(
        `Pairs changed or no connection. Updating stream with ${currentPairs.size} pairs`,
      )
      logger.debug(`Pairs: ${[...currentPairs.keys()].join(', ')}`)

      await this.updateStream(context, currentPairs)
    }
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  private havePairsChanged(pairs: Map<string, RequestParams>): boolean {
    if (pairs.size !== this.activePairs.size) {
      return true
    }
    for (const [key] of pairs) {
      if (!this.activePairs.has(key)) {
        return true
      }
    }
    return false
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

    logger.debug(`Opening single SSE connection for ${pairsArray.length} pairs`)
    logger.debug(`Pairs: ${pairsArray.map((p) => `${p.base}/${p.quote}`).join(', ')}`)

    this.lastConnectionAttempt = Date.now()
    this.currentAbortController = new AbortController()

    try {
      const req = this.buildSSERequest(context, pairsArray, this.currentAbortController.signal)
      const key = `coinpaprika-state/stream:${[...this.activePairs.keys()].join(',')}`
      const { response } = await this.requester.request<Readable>(key, req)
      const httpResp = response

      if (httpResp.status !== 200 || !httpResp.data) {
        // try to read error body if available
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

        // mark closed immediately to prevent races
        this.currentAbortController = null
        this.isConnected = false

        if (!aborted && this.activePairs.size > 0) {
          const since = Date.now() - this.lastConnectionAttempt
          const delay = Math.max(this.reconnectDelay - since, 0) + Math.floor(Math.random() * 1000)
          logger.info(`SSE ended; reconnecting in ${delay} ms...`)
          await sleep(delay)
          await this.createSSEConnection(context)
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

  async _handleRequest(
    _params: RequestParams,
  ): Promise<AdapterResponse<TransportTypes['Response']>> {
    // This fallback shouldn't be called in normal operation - data should come from cache via backgroundHandler
    logger.debug('Foreground request hit fallback: no cached data yet')
    return {
      statusCode: 504,
      errorMessage:
        'No cached data available. Streaming transport is initializing or waiting for data.',
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: TransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async close(): Promise<void> {
    logger.debug('Closing SSE connection')

    if (this.isConnected && this.currentAbortController) {
      this.currentAbortController.abort()
      this.currentAbortController = null
      this.isConnected = false
    }
    this.activePairs.clear()

    if (this.sseParser) {
      this.sseParser.reset()
    }
    this.sseParser = null
  }

  private async handleParsedSSEEvent(eventType: string, rawData: string): Promise<void> {
    if (eventType !== COINPAPRIKA_STATE_EVENT_TYPE) {
      logger.debug(`Skipping event type: ${eventType}`)
      return
    }

    try {
      const streamData: CoinpaprikaStreamData = JSON.parse(rawData)
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
