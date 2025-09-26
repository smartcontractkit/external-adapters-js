import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import type { AxiosRequestConfig } from 'axios'
import { Readable } from 'node:stream'
import { BaseEndpointTypes, inputParameters } from '../endpoint/coinpaprika-state'
import { SSEParser } from './sse'

const logger = makeLogger('CoinpaprikaStateTransport')

type RequestParams = typeof inputParameters.validated

// Coinpaprika’s OpenAPI doc says all numeric values are encoded as strings to preserve precision
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

const norm = (s: string) => s.trim().toUpperCase()
const normalizeParams = (p: RequestParams): RequestParams => ({
  ...p,
  base: norm(p.base),
  quote: norm(p.quote),
})

/**
 * Single-connection SSE transport that batches all pairs into one POST and streams state_price ticks into the cache.
 *
 * */
export class CoinpaprikaStateTransport extends SubscriptionTransport<TransportTypes> {
  name!: string
  responseCache!: ResponseCache<TransportTypes>
  requester!: Requester

  // single SSE conn for all pairs
  private activeConnection: AbortController | null = null
  private activePairs: Map<string, RequestParams> = new Map()
  // reconnection backoff base (ms); jitter added per attempt //TODO
  private lastConnectionAttempt = 0
  private reconnectDelay = 5000
  // guard to prevent reconnects during/after shutdown
  private isShuttingDown = false
  private sseParser: SSEParser | null = null

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.isShuttingDown = false
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  async backgroundHandler(context: EndpointContext<TransportTypes>, entries: RequestParams[]) {
    if (this.isShuttingDown) return

    // normalize params once at ingestion
    const normalized = entries.map(normalizeParams)

    // build current pairs map
    const currentPairs = new Map<string, RequestParams>()
    for (const e of normalized) currentPairs.set(`${e.base}/${e.quote}`, e)

    // detect changes in the requested pair set (triggers reconnect if changed)
    const pairsChanged = this.havePairsChanged(currentPairs)

    if (pairsChanged || !this.activeConnection) {
      logger.info(`Pairs changed or no connection. Updating stream with ${currentPairs.size} pairs`)
      logger.debug(`Pairs: ${[...currentPairs.keys()].join(', ')}`)

      await this.updateStream(context, currentPairs)
    }
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  private havePairsChanged(pairs: Map<string, RequestParams>): boolean {
    if (pairs.size !== this.activePairs.size) return true
    for (const [key] of pairs) {
      if (!this.activePairs.has(key)) return true
    }
    return false
  }

  private async updateStream(
    context: EndpointContext<TransportTypes>,
    pairs: Map<string, RequestParams>,
  ) {
    if (this.isShuttingDown) return

    // close existing connection if any
    if (this.activeConnection) {
      logger.info('Closing existing SSE connection')
      this.activeConnection.abort()
      this.activeConnection = null
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
  ): AxiosRequestConfig {
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
      timeout: 60_000,
      validateStatus: () => true,
    }
  }

  private async createSSEConnection(context: EndpointContext<TransportTypes>) {
    if (this.isShuttingDown) return

    const pairsArray = Array.from(this.activePairs.values()).map((p) => ({
      base: p.base,
      quote: p.quote,
    }))

    logger.info(`Opening single SSE connection for ${pairsArray.length} pairs`)
    logger.debug(`Pairs: ${pairsArray.map((p) => `${p.base}/${p.quote}`).join(', ')}`)

    this.lastConnectionAttempt = Date.now()
    const controller = new AbortController()
    this.activeConnection = controller

    try {
      const req = this.buildSSERequest(context, pairsArray, controller.signal)
      const key = `coinpaprika-state/stream:${[...this.activePairs.keys()].join(',')}`
      const { response } = await this.requester.request<Readable>(key, req)
      const axiosResp = response

      if (axiosResp.status !== 200 || !axiosResp.data) {
        // try to read error body if available
        let errDetail = `HTTP error! status: ${axiosResp.status}`
        let rawErrBody = ''
        try {
          const text = await new Promise<string>((resolve) => {
            let buf = ''
            ;(axiosResp.data as Readable)
              .on('data', (c: Buffer) => (buf += c.toString('utf8')))
              .on('end', () => resolve(buf))
              .on('error', () => resolve(''))
          })
          rawErrBody = text
          try {
            const j = JSON.parse(text)
            if (j?.error && j?.details) errDetail = `${j.error}: ${j.details}`
          } catch {
            logger.error(`Provider error body (not JSON): ${rawErrBody}`)
          }
        } catch {
          // ignore parse error; keep default errDetail
        }

        const statusCode =
          axiosResp.status === 500
            ? 502
            : axiosResp.status === 401
            ? 401
            : axiosResp.status === 400
            ? 400
            : axiosResp.status === 429
            ? 429
            : axiosResp.status

        const errorResponse: AdapterResponse<TransportTypes['Response']> = {
          statusCode,
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

        if (this.activeConnection === controller) this.activeConnection = null
        return
      }

      const stream: Readable = axiosResp.data as Readable
      let aborted = false
      this.sseParser = new SSEParser('t_s')

      const handleParsedEvent = async (eventType: string, rawData: string) => {
        if (this.isShuttingDown) return
        if (eventType !== 't_s') {
          logger.debug(`Skipping event type: ${eventType}`)
          return
        }

        try {
          const streamData: CoinpaprikaStreamData = JSON.parse(rawData)
          const pairKey = `${norm(streamData.base_token_symbol)}/${norm(streamData.quote_symbol)}`
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

      const onData = async (chunk: Buffer) => {
        if (this.isShuttingDown) return
        const raw = chunk.toString('utf8')
        logger.debug(`Raw price state update message received:\n${raw}`)

        this.sseParser!.push(raw, (evt, data) => {
          void handleParsedEvent(evt, data)
        })
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
        if (this.activeConnection === controller) this.activeConnection = null

        if (!this.isShuttingDown && !aborted && this.activePairs.size > 0) {
          const since = Date.now() - this.lastConnectionAttempt
          const delay = Math.max(this.reconnectDelay - since, 0) + Math.floor(Math.random() * 1000)
          logger.info(`SSE ended; reconnecting in ${delay} ms...`)
          await sleep(delay)
          if (!this.isShuttingDown) {
            await this.createSSEConnection(context)
          }
        }
      }

      // wire events
      stream.on('data', (chunk) => {
        void onData(chunk as Buffer)
      })
      stream.once('error', onError)
      stream.once('end', onEnd)
    } catch (error) {
      this.activeConnection = null
      if (this.isShuttingDown) return
      logger.error(`Failed to create SSE connection: ${error}`)
      return
    }
  }

  private async handleStreamData(param: RequestParams, streamData: CoinpaprikaStreamData) {
    // coerce string -> number
    const toNum = (value: string | number | undefined | null): number => {
      if (typeof value === 'number') return value
      if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value)
        return Number.isFinite(n) ? n : NaN
      }
      return NaN
    }
    const statePrice = toNum(streamData.state_price)
    const blockTime = toNum(streamData.block_time)

    // guard against bad payloads
    if (!Number.isFinite(statePrice) || !Number.isFinite(blockTime) || blockTime <= 0) {
      logger.warn(
        `Bad numeric fields for ${param.base}/${param.quote}: ${JSON.stringify(streamData)}`,
      )
      return
    }

    const response: AdapterResponse<TransportTypes['Response']> = {
      data: {
        result: statePrice,
        timestamp: blockTime,
      },
      statusCode: 200,
      result: statePrice,
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

  async _handleRequest(_: RequestParams): Promise<AdapterResponse<TransportTypes['Response']>> {
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
    logger.info('Closing SSE connection')
    this.isShuttingDown = true

    if (this.activeConnection) {
      this.activeConnection.abort()
      this.activeConnection = null
    }
    this.activePairs.clear()

    if (this.sseParser) this.sseParser.reset()
    this.sseParser = null
  }
}

export const CoinpaprikaSubscriptionTransport = new CoinpaprikaStateTransport()
