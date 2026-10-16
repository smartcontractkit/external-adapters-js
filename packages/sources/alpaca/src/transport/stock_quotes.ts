import {
  TransportDependencies,
  WebSocket,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
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

// Sends the auth message and resolves on the 'authenticated' frame; rejects on an error frame.
// There is no listener cleanup and no close/reject handling: the framework bounds the open
// handler with WS_CONNECTION_OPEN_TIMEOUT (owner decision: the framework owns timeouts and
// reconnects), a settled promise ignores later settle calls, and the listener dies with the
// connection. The parse is guarded so a malformed frame keeps the wait alive instead of
// throwing inside the event emitter.
export const authenticate = (connection: WebSocket, accessToken: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    connection.addEventListener('message', (event: WebSocket.MessageEvent) => {
      let frames: unknown
      try {
        frames = JSON.parse(event.data.toString())
      } catch {
        return // malformed frame: keep waiting for the auth reply
      }
      if (!Array.isArray(frames)) {
        return
      }
      if (frames.some((f) => f?.msg === 'authenticated')) {
        resolve()
      }
      if (frames.some((f) => f?.T === 'error')) {
        reject(new Error('Alpaca WS auth failed'))
      }
    })
    connection.send(JSON.stringify(authMessage(accessToken)))
  })

type Params = TypeFromDefinition<WsTransportTypes['Parameters']>

// Provider time t (Unix ms) of the latest accepted quote per uppercase symbol (spec data_freshness
// timestamp_field t). A quote with t strictly older than the stored t is dropped, so a replayed
// older quote never overwrites a newer one; the cache outlives reconnects and unsubscribes, so
// this map does too; it grows only with the symbols ever subscribed.
// framework_alignment exception: latestQuotes — spec data-freshness policy; the framework has no
// per-symbol staleness hook.
//
// A t implausibly far AHEAD of the host clock (provider clock failure) is dropped BEFORE it
// touches the guard: an unguarded far-future t would make every later real quote "older" and
// silently starve the feed until restart.
const MAX_FUTURE_SKEW_MS = 60_000

// Alpaca symbols are uppercase (spec sample_response S: "AAPL")
const toProviderSymbol = (base: string): string => base.toUpperCase()

export class StockQuotesTransport extends WebSocketTransport<WsTransportTypes> {
  requester!: Requester

  // Token for the next connect, fetched in options() before the socket opens. Never logged.
  accessToken = ''

  // framework_alignment exception: latestQuotes — see the comment above the class.
  latestQuotes: Map<string, number> = new Map()

  // Symbols subscribed on the CURRENT connection (cleared on open, same lifecycle as the
  // framework's localSubscriptions). framework_alignment exception: subscribedSymbols —
  // the framework tracks subscriptions by full params; the provider contract is one
  // subscribe per symbol per connection, so the symbol-level dedupe lives here.
  subscribedSymbols: Set<string> = new Set()

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
        open: async (connection) => {
          this.subscribedSymbols.clear()
          await authenticate(connection, this.accessToken).catch((error) => {
            // The framework does not close a socket whose open handler rejects; close it here
            // to free one of the 15 account connections.
            connection.close()
            throw error
          })
        },
        message: (frames) => this.handleMessage(frames),
      },
      builders: {
        // dxfeed's customSubscriptionMessages pattern: several params combos format to the SAME
        // provider subscribe message (the flags don't exist on the wire), so dedupe by symbol
        // and keep a symbol subscribed while ANY of its variants is desired. The adapter stays
        // stateless: the framework's subscriptionSet owns the desired set (with TTL).
        customSubscriptionMessages: (
          _context,
          subscriptions: SubscriptionDeltas<TypeFromDefinition<WsTransportTypes['Parameters']>>,
        ) => {
          const symbolOf = (params: Params) => toProviderSymbol(params.base)
          const desired = new Set(subscriptions.desired.map(symbolOf))
          const add = [...new Set(subscriptions.new.map(symbolOf))].filter(
            (s) => !this.subscribedSymbols.has(s),
          )
          const remove = [...new Set(subscriptions.stale.map(symbolOf))].filter(
            (s) => !desired.has(s) && this.subscribedSymbols.has(s),
          )
          add.forEach((s) => this.subscribedSymbols.add(s))
          remove.forEach((s) => this.subscribedSymbols.delete(s))
          return [...remove.map(unsubscribeMessage), ...add.map(subscribeMessage)]
        },
      },
    })
  }

  // One result per DESIRED params variant of the frame's symbol, read from the framework's
  // subscriptionSet (the requested casing, TTL-managed). Requires CACHE_TYPE local: getAll()
  // must resolve synchronously for the sync message handler.
  private desiredVariants(symbol: string): Params[] {
    const entries = this.subscriptionSet.getAll()
    if (!Array.isArray(entries)) {
      return []
    }
    return entries.filter((p) => toProviderSymbol(p.base) === symbol)
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
    if (typeof symbol !== 'string') {
      return []
    }
    const variants = this.desiredVariants(symbol)
    if (!variants.length) {
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
    if (providerTimeMs > Date.now() + MAX_FUTURE_SKEW_MS) {
      logger.warn(
        { symbol, providerTimeMs },
        'Alpaca WS: dropped quote with implausibly future t (provider clock failure?)',
      )
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
    return variants.map((params) => ({
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

// A parsed quote always carries its provider time (owner decision wire_timestamp)
type QuoteResponse = PartialSuccessfulResponse<WsTransportTypes['Response']> & {
  timestamps: { providerIndicatedTimeUnixMs: number }
}

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

// Owner decision one_sided_semantics=match_reference: mid uses the non-zero side. Spec
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
// (null in JSON), as the reference streams do. Owner decision wire_timestamp=provider_indicated_from_t: a quote
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
    // The spec example requires result = mid_price; it overrides the reference implementation (result null)
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
