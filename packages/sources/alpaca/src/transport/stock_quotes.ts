import {
  TransportDependencies,
  WebSocket,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import {
  makeLogger,
  PartialSuccessfulResponse,
  ProviderResult,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import Decimal from 'decimal.js'
import type { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { getAccessToken } from './auth'

const logger = makeLogger('AlpacaStockQuotesTransport')

type AlpacaEvent = {
  T?: unknown
  S?: unknown
  bp?: unknown
  bs?: unknown
  ap?: unknown
  as?: unknown
  t?: unknown
  code?: unknown
  msg?: unknown
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    // Alpaca sends every frame as a JSON array, even for a single event
    WsMessage: AlpacaEvent[]
  }
}

// Spec wire formats (token_usage.ws_auth_message and the stock_quotes subscribe message), defined
// once here; the tests import the auth and subscribe builders
export const authMessage = (accessToken: string) => ({
  action: 'auth',
  key: 'access_token',
  secret: accessToken,
})
export const subscribeMessage = (symbol: string) => ({ action: 'subscribe', quotes: [symbol] })
const unsubscribeMessage = (symbol: string) => ({ action: 'unsubscribe', quotes: [symbol] })

// Sends the auth message and resolves on the 'authenticated' frame; rejects on an error frame or a
// socket close. The framework bounds the wait with WS_CONNECTION_OPEN_TIMEOUT around the open
// handler (spec ~10 s auth deadline; owner decision: the framework owns reconnects), so there is no timer here.
export const authenticate = (connection: WebSocket, accessToken: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const cleanup = () => {
      connection.removeEventListener('message', onMessage)
      connection.removeEventListener('close', onClose)
    }
    const onClose = () => {
      cleanup()
      reject(new Error('Alpaca WS closed before authentication'))
    }
    const onMessage = (event: WebSocket.MessageEvent) => {
      let events: unknown
      try {
        events = JSON.parse(event.data.toString())
      } catch {
        return
      }
      for (const frame of Array.isArray(events) ? (events as AlpacaEvent[]) : []) {
        if (frame.T === 'success' && frame.msg === 'authenticated') {
          cleanup()
          logger.info('Alpaca WS: authenticated')
          return resolve()
        }
        if (frame.T === 'error') {
          cleanup()
          logger.warn({ code: frame.code, msg: frame.msg }, 'Alpaca WS auth failed')
          return reject(new Error('Alpaca WS auth failed'))
        }
      }
    }
    connection.addEventListener('message', onMessage)
    connection.addEventListener('close', onClose)
    connection.send(JSON.stringify(authMessage(accessToken)))
  })

type Params = TypeFromDefinition<WsTransportTypes['Parameters']>

// A parsed quote always carries its provider time (owner decision wire_timestamp)
type QuoteResponse = PartialSuccessfulResponse<WsTransportTypes['Response']> & {
  timestamps: { providerIndicatedTimeUnixMs: number }
}

// The framework diffs subscriptions by JSON.stringify(params), so a base case variant ('aapl' after
// 'AAPL') is a separate subscription whose unsubscribe must not remove the other
const variantKey = (params: Params): string => JSON.stringify(params)

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

// Alpaca symbols are uppercase (spec sample_response S: "AAPL")
const toProviderSymbol = (base: string): string => base.toUpperCase()

// Owner decision one_sided_semantics=match_reference (dxfeed): mid uses the non-zero side. Spec
// wind_down_frames: both sides zero has no mid (undefined), so the frame is dropped.
export const computeMidPrice = (bp: number, ap: number): number | undefined => {
  if (bp === 0 && ap === 0) {
    return undefined
  }
  if (bp === 0) {
    return ap
  }
  if (ap === 0) {
    return bp
  }
  return new Decimal(bp).plus(ap).div(2).toNumber()
}

// Bid and ask report as-is (zero on the missing side). Owner decision
// one_sided_semantics=match_reference overrides the null part of wind_down_frames.rule. A malformed
// frame gives undefined; only its symbol is logged. A missing or invalid volume reports as NaN
// (null in JSON), as dxfeed does. Owner decision wire_timestamp=provider_indicated_from_t: a quote
// without a valid t has no provider timestamp, so it is dropped. Field presence on the overnight
// feed is not wire-verified, so the drop is a warn.
export const parseQuote = (quote: AlpacaEvent): QuoteResponse | undefined => {
  const { S: symbol, bp, ap } = quote
  if (typeof symbol !== 'string' || !symbol) {
    return undefined
  }
  if (!isNonNegativeNumber(bp) || !isNonNegativeNumber(ap)) {
    logger.debug({ symbol, reason: 'invalid price' }, 'Alpaca WS: dropped quote')
    return undefined
  }
  const providerTimeMs = typeof quote.t === 'string' ? Date.parse(quote.t) : NaN
  if (Number.isNaN(providerTimeMs)) {
    logger.warn({ symbol, reason: 'missing or invalid t' }, 'Alpaca WS: dropped quote')
    return undefined
  }
  const midPrice = computeMidPrice(bp, ap)
  if (midPrice === undefined) {
    return undefined
  }
  return {
    // The spec example requires result = mid_price; it overrides the dxfeed reference (result null)
    result: midPrice,
    data: {
      mid_price: midPrice,
      bid_price: bp,
      bid_volume: isNonNegativeNumber(quote.bs) ? quote.bs : NaN,
      ask_price: ap,
      ask_volume: isNonNegativeNumber(quote.as) ? quote.as : NaN,
    },
    timestamps: { providerIndicatedTimeUnixMs: providerTimeMs },
  }
}

export class StockQuotesTransport extends WebSocketTransport<WsTransportTypes> {
  requester!: Requester

  // Token for the next connect, fetched in options() before the socket opens. Never logged.
  accessToken = ''

  // Subscribed params per uppercase provider symbol, keyed by variantKey. Variants of a symbol
  // share one provider subscription. The builders keep this map, because the framework's
  // localSubscriptions updates only after a background run. It is per connection and cleared in
  // the open handler: symbols that expire during a reconnect get no unsubscribe call.
  variants: Map<string, Map<string, Params>> = new Map()
  // Provider time t (Unix ms) of the latest accepted quote per uppercase symbol (spec data_freshness
  // timestamp_field t). A quote with t strictly older than the stored t is dropped, with no age
  // limit, so a replayed older quote never overwrites a newer one. The cache outlives reconnects
  // and unsubscribes, so this map does too; it grows only with the symbols ever subscribed.
  latestQuotes: Map<string, number> = new Map()

  constructor() {
    super({
      url: async (context) => context.adapterSettings.WS_API_ENDPOINT,
      // The framework calls options() directly before each connect, so each connect gets a new
      // token (refresh_policy per_connect), and a failed token request takes no account connection
      options: async (context) => {
        this.accessToken = await getAccessToken(context.adapterSettings, this.requester)
        return {}
      },
      handlers: {
        // No network I/O here: only the auth message with the token fetched before open. variants
        // is rebuilt from the framework's resubscribe after open. The framework owns timeout and
        // retries (owner decision: the framework owns reconnects), but it does not close a socket whose open
        // handler rejects, so a failed auth closes it here to free one of the 15 account connections.
        open: async (connection) => {
          this.variants.clear()
          await authenticate(connection, this.accessToken).catch((error) => {
            connection.close()
            throw error
          })
        },
        message: (frames) => this.handleMessage(frames),
      },
      builders: {
        subscribeMessage: (params) => {
          const symbol = toProviderSymbol(params.base)
          const symbolVariants = this.variants.get(symbol)
          if (symbolVariants) {
            symbolVariants.set(variantKey(params), params)
            return undefined
          }
          this.variants.set(symbol, new Map([[variantKey(params), params]]))
          return subscribeMessage(symbol)
        },
        unsubscribeMessage: (params) => {
          const symbol = toProviderSymbol(params.base)
          const symbolVariants = this.variants.get(symbol)
          symbolVariants?.delete(variantKey(params))
          if (symbolVariants?.size) {
            return undefined
          }
          this.variants.delete(symbol)
          return unsubscribeMessage(symbol)
        },
      },
    })
  }

  handleMessage(frames: AlpacaEvent[]): ProviderResult<WsTransportTypes>[] {
    if (!Array.isArray(frames)) {
      logger.warn('Alpaca WS: ignored non-array frame')
      return []
    }
    const results: ProviderResult<WsTransportTypes>[] = []
    for (const frame of frames) {
      // Only quote frames produce results; success and subscription frames are skipped. Error frames
      // are logged at warn and skipped (never thrown), so they write no cache entry. Error frames
      // carry no symbol, and the ticket's claim that an invalid symbol rejects the whole subscribe
      // message is unconfirmed.
      if (frame?.T === 'error') {
        logger.warn({ code: frame.code, msg: frame.msg }, 'Alpaca error frame')
      } else if (frame?.T === 'q') {
        results.push(...this.handleQuote(frame))
      }
    }
    return results
  }

  // One result per subscribed variant of the symbol, written with that variant's params. A new
  // variant is served by the next quote frame.
  handleQuote(quote: AlpacaEvent): ProviderResult<WsTransportTypes>[] {
    // A quote for an unsubscribed symbol (e.g. late after the last unsubscribe) is dropped unparsed
    const symbol = quote.S
    const symbolVariants = typeof symbol === 'string' && this.variants.get(symbol)
    if (!symbolVariants) {
      return []
    }
    const response = parseQuote(quote)
    if (!response) {
      return []
    }
    const providerTimeMs = response.timestamps.providerIndicatedTimeUnixMs
    const latestTimeMs = this.latestQuotes.get(symbol)
    if (latestTimeMs !== undefined && providerTimeMs < latestTimeMs) {
      logger.debug({ symbol, reason: 'stale t' }, 'Alpaca WS: dropped quote')
      return []
    }
    this.latestQuotes.set(symbol, providerTimeMs)

    const { bid_volume, ask_volume } = response.data
    const requireVolumeResponse =
      Number.isNaN(bid_volume) || Number.isNaN(ask_volume)
        ? {
            statusCode: 502,
            errorMessage: 'Bid volume or Ask volume is invalid.',
          }
        : response
    return [...symbolVariants.values()].map((params) => ({
      params,
      response: params.requireVolume ? requireVolumeResponse : response,
    }))
  }

  override async initialize(
    dependencies: TransportDependencies<WsTransportTypes>,
    adapterSettings: WsTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }
}

export const wsTransport = new StockQuotesTransport()
