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
import Decimal from 'decimal.js'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { AUTH_TIMEOUT_MS, getAccessToken } from './auth'

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
// once here and imported by the tests
export const authMessage = (accessToken: string) => ({
  action: 'auth',
  key: 'access_token',
  secret: accessToken,
})
export const subscribeMessage = (symbol: string) => ({ action: 'subscribe', quotes: [symbol] })
export const unsubscribeMessage = (symbol: string) => ({ action: 'unsubscribe', quotes: [symbol] })

// Sends the auth message and resolves on the 'authenticated' frame. Rejects on an error frame, a
// socket error or close, or after AUTH_TIMEOUT_MS. Every failure closes the socket, because a
// failed auth must not hold one of the 15 account connections. Every outcome removes all listeners
// and the timer.
const authenticate = (connection: WebSocket, accessToken: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer)
      connection.removeEventListener('message', onMessage)
      connection.removeEventListener('close', onClose)
      connection.removeEventListener('error', onClose)
    }
    const fail = (error: Error) => {
      cleanup()
      connection.close()
      reject(error)
    }
    const onClose = () => fail(new Error('Alpaca WS closed before authentication'))
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
          return fail(new Error(`Alpaca WS auth failed with code ${frame.code}: ${frame.msg}`))
        }
      }
    }
    // Listeners first, so a close that arrives while the auth message is sent is not lost
    connection.addEventListener('message', onMessage)
    connection.addEventListener('close', onClose)
    connection.addEventListener('error', onClose)
    const timer = setTimeout(() => fail(new Error('Alpaca WS auth timed out')), AUTH_TIMEOUT_MS)
    connection.send(JSON.stringify(authMessage(accessToken)))
  })

// Subscribed param variant keys (JSON.stringify(params)) per uppercase provider symbol
type Variants = Map<string, Set<string>>

// Provider time t (ms) of the latest accepted quote per uppercase symbol (spec data_freshness
// timestamp_field t). A quote with t not newer than the stored t is dropped, with no age limit, so a
// replayed older quote never overwrites a newer one. The entry guards by t until the symbol is
// unsubscribed.
type LatestQuotes = Map<string, number>

// A quote with t more than this far ahead of local time is rejected, so one future-dated t cannot
// block all later quotes for its symbol
const MAX_FUTURE_T_MS = 60_000

// A parsed quote always carries data and the provider time
type QuoteResponse = PartialSuccessfulResponse<WsTransportTypes['Response']> & {
  timestamps: { providerIndicatedTimeUnixMs: number }
}

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

// Alpaca symbols are uppercase (spec sample_response S: "AAPL")
const toProviderSymbol = (base: string): string => base.toUpperCase()

// RFC 3339 t carries nanoseconds. The fraction is cut to 3 digits before parsing so the result is
// truncated to milliseconds, never rounded.
export const parseProviderTimeMs = (t: string): number =>
  Date.parse(t.replace(/(\.\d{3})\d+/, '$1'))

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
// (null in JSON), as dxfeed does.
export const parseQuote = (quote: AlpacaEvent): QuoteResponse | undefined => {
  const { S: symbol, bp, ap } = quote
  if (typeof symbol !== 'string' || !symbol) {
    return undefined
  }
  if (!isNonNegativeNumber(bp) || !isNonNegativeNumber(ap)) {
    logger.debug({ symbol, reason: 'invalid price' }, 'Alpaca WS: dropped quote')
    return undefined
  }
  const midPrice = computeMidPrice(bp, ap)
  if (midPrice === undefined) {
    return undefined
  }
  // Owner decision wire_timestamp=provider_indicated_from_t
  const providerTimeMs = typeof quote.t === 'string' ? parseProviderTimeMs(quote.t) : NaN
  if (Number.isNaN(providerTimeMs)) {
    logger.debug({ symbol, reason: 'missing or invalid t' }, 'Alpaca WS: dropped quote')
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
    timestamps: {
      providerIndicatedTimeUnixMs: providerTimeMs,
    },
  }
}

const handleQuote = (
  quote: AlpacaEvent,
  variants: Variants,
  latestQuotes: LatestQuotes,
): ProviderResult<WsTransportTypes>[] => {
  const symbol = quote.S as string
  // A late quote after the last unsubscribe is ignored, so it leaves no t behind
  if (!variants.has(symbol)) {
    return []
  }
  const response = parseQuote(quote)
  if (!response) {
    return []
  }
  // A rejected quote's t is never stored
  const tMs = response.timestamps.providerIndicatedTimeUnixMs
  if (tMs - Date.now() > MAX_FUTURE_T_MS) {
    logger.debug({ symbol, reason: 'future t' }, 'Alpaca WS: dropped quote')
    return []
  }
  const latestTMs = latestQuotes.get(symbol)
  if (latestTMs !== undefined && tMs <= latestTMs) {
    logger.debug({ symbol, reason: 'stale t' }, 'Alpaca WS: dropped quote')
    return []
  }
  latestQuotes.set(symbol, tMs)

  const { bid_volume, ask_volume } = response.data
  const requireVolumeResponse =
    Number.isNaN(bid_volume) || Number.isNaN(ask_volume)
      ? {
          statusCode: 502,
          errorMessage: `Bid volume: ${quote.bs} or Ask volume: ${quote.as} for ${symbol} is invalid.`,
        }
      : response
  // Deliberate fan-out matching the dxfeed stock_quotes reference: one response per
  // requireVolume x isOvernight variant (4 cache writes per frame), so a new variant of a
  // subscribed symbol is served from cache at once. requireVolume=true errors on an invalid volume.
  // isOvernight does not filter: dxfeed accepts only its 'O' exchange code, while Alpaca overnight
  // frames use exchange 'B'.
  return [false, true].flatMap((isOvernight) => [
    { params: { base: symbol, quote: 'USD', requireVolume: false, isOvernight }, response },
    {
      params: { base: symbol, quote: 'USD', requireVolume: true, isOvernight },
      response: requireVolumeResponse,
    },
  ])
}

const handleMessage = (
  frames: AlpacaEvent[],
  variants: Variants,
  latestQuotes: LatestQuotes,
): ProviderResult<WsTransportTypes>[] => {
  if (!Array.isArray(frames)) {
    logger.warn('Alpaca WS: ignored non-array frame')
    return []
  }
  const results: ProviderResult<WsTransportTypes>[] = []
  for (const frame of frames) {
    // Error frames are logged at warn level only and write no cache entry: requesters get 504 until
    // a good value arrives or the cached value's TTL expires. Error frames carry no symbol, and the
    // ticket's claim that an invalid symbol rejects the whole subscribe message is unconfirmed.
    if (frame?.T === 'error') {
      logger.warn(`Alpaca WS error frame: code ${frame.code}, msg ${frame.msg}`)
    } else if (frame?.T === 'q') {
      results.push(...handleQuote(frame, variants, latestQuotes))
    }
  }
  return results
}

export class StockQuotesTransport extends WebSocketTransport<WsTransportTypes> {
  requester!: Requester

  // Token for the next connect, fetched in options() before the socket opens. Never logged.
  accessToken = ''

  // Variants of a symbol (case, requireVolume, isOvernight) share one provider subscription. The
  // builders keep this map, because the framework's localSubscriptions updates only after a
  // background run. latestQuotes outlives reconnects, so a replayed older quote cannot overwrite the
  // cached newer response. Each entry guards by t until the symbol is unsubscribed (its last variant
  // leaves), so the map holds only subscribed symbols.
  variants: Variants = new Map()
  latestQuotes: LatestQuotes = new Map()

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
        // is rebuilt from the framework's resubscribe after open. The framework owns retries
        // (owner decision reconnect_backoff=cut).
        open: async (connection) => {
          this.variants.clear()
          await authenticate(connection, this.accessToken)
        },
        message: (frames) => handleMessage(frames, this.variants, this.latestQuotes),
      },
      builders: {
        subscribeMessage: (params) => {
          const symbol = toProviderSymbol(params.base)
          const symbolVariants = this.variants.get(symbol)
          if (symbolVariants) {
            symbolVariants.add(JSON.stringify(params))
            return undefined
          }
          this.variants.set(symbol, new Set([JSON.stringify(params)]))
          return subscribeMessage(symbol)
        },
        unsubscribeMessage: (params) => {
          const symbol = toProviderSymbol(params.base)
          const symbolVariants = this.variants.get(symbol)
          symbolVariants?.delete(JSON.stringify(params))
          if (symbolVariants?.size) {
            return undefined
          }
          this.variants.delete(symbol)
          this.latestQuotes.delete(symbol)
          return unsubscribeMessage(symbol)
        },
      },
    })
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
