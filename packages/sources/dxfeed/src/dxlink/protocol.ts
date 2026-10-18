/**
 * dxLink wire protocol library (https://docs.dxfeed.com/dxlink-ws/), spec
 * OPDATA-9200. Replaces the adapter's deleted legacy session transport (the
 * spec's transport-deletion exception; see src/config for the startup env
 * check).
 *
 * TEMPLATE-ALIGNMENT: this module is provider-specific protocol code outside
 * the template-adapter subset — it lives at the spec framework_alignment
 * exceptions dxlink-control-protocol (the dxLink SETUP / CHANNEL_REQUEST /
 * FEED_SETUP handshake, FEED_SUBSCRIPTION fan-out and COMPACT FEED_DATA
 * parsing have no framework mechanism) and basic-auth-not-oauth (the Basic
 * Authorization handshake header, cfbenchmarks crypto-ws.ts pattern). The
 * transport layer in src/transport wires these pieces into the framework's
 * WebSocketTransport hooks and owns no protocol logic itself.
 */
import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { timeoutPromise } from '@chainlink/external-adapter-framework/util'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

const logger = makeLogger('DxLink Websocket')

export type DxLinkRecord = (string | number | boolean)[]

export type DxLinkSubscriptionEntry = { symbol: string; type: string }

export type DxLinkMessage = {
  type: string
  channel?: number
  version?: string
  keepaliveTimeout?: number
  acceptKeepaliveTimeout?: number
  service?: string
  parameters?: Record<string, unknown>
  acceptAggregationPeriod?: number
  acceptDataFormat?: string
  acceptEventFields?: Record<string, string[]>
  eventFields?: Record<string, string[]>
  // COMPACT FEED_DATA: eventType first, then the record payload — typed as a
  // variable-length structure so frames with a single element or extra elements
  // type-check. The runtime parser (DxLinkFeed.onFeedData) validates the shape
  // itself: it filters non-FEED_DATA/malformed frames and truncates trailing
  // partial records (parseCompactFeedData).
  data?: Array<string | DxLinkRecord>
  add?: DxLinkSubscriptionEntry[]
  remove?: DxLinkSubscriptionEntry[]
  symbol?: string
  eventType?: string
  message?: string
  code?: string
}

/**
 * Parsed inbound dxLink frames as a discriminated union (parse-frame extension
 * point, template transport-ws-subscribe): every variant carries a
 * string-literal `type` discriminant so handlers and tests can narrow with a
 * plain equality check, and ONLY the FEED_DATA variant carries `data` —
 * control frames (FEED_CONFIG / KEEPALIVE / ERROR / CHANNEL_CLOSED)
 * structurally have no data payload. Built over DxLinkMessage minus the wide
 * `type` / `data` pair so the wire shape stays defined in one place. Exported
 * so the parse-frame tests can narrow before any data access.
 */
type DxLinkFrameFields = Omit<DxLinkMessage, 'type' | 'data'>
export type DxLinkFrame =
  | (DxLinkFrameFields & { type: 'FEED_DATA'; data: Array<string | DxLinkRecord> })
  | (DxLinkFrameFields & { type: 'FEED_CONFIG' })
  | (DxLinkFrameFields & { type: 'KEEPALIVE' })
  | (DxLinkFrameFields & { type: 'ERROR' })
  | (DxLinkFrameFields & { type: 'CHANNEL_CLOSED' })

export type DxLinkProviderTypes = {
  Provider: {
    WsMessage: DxLinkMessage
  }
}

export type DxLinkTransportGenerics = TransportGenerics & DxLinkProviderTypes

// The FEED data channel requested by the spec primary_command (CHANNEL_REQUEST channel 1)
export const DXLINK_FEED_CHANNEL = 1

// Spec stock_quotes FEED_CONFIG eventFields.Quote
const QUOTE_EVENT_FIELDS = [
  'eventType',
  'eventSymbol',
  'time',
  'bidPrice',
  'askPrice',
  'bidSize',
  'askSize',
  'bidExchangeCode',
  'askExchangeCode',
]

// Spec price FEED_CONFIG eventFields.Trade / .TradeETH
const TRADE_EVENT_FIELDS = [
  'eventType',
  'eventSymbol',
  'time',
  'price',
  'size',
  'sequence',
  'exchangeCode',
  'change',
  'dayVolume',
  'dayTurnover',
  'tickDirection',
  'extendedTradingHours',
]

/** Spec OPDATA-9200 primary_command handshake sequence */
export const dxLinkHandshakeMessages = (): DxLinkMessage[] => [
  {
    type: 'SETUP',
    channel: 0,
    version: '0.1-js/1.0.0',
    keepaliveTimeout: 60,
    acceptKeepaliveTimeout: 60,
  },
  {
    type: 'CHANNEL_REQUEST',
    channel: DXLINK_FEED_CHANNEL,
    service: 'FEED',
    parameters: { contract: 'AUTO' },
  },
  {
    type: 'FEED_SETUP',
    channel: DXLINK_FEED_CHANNEL,
    acceptAggregationPeriod: 1,
    acceptDataFormat: 'COMPACT',
    acceptEventFields: {
      Quote: QUOTE_EVENT_FIELDS,
      Trade: TRADE_EVENT_FIELDS,
      TradeETH: TRADE_EVENT_FIELDS,
    },
  },
]

/** The acceptEventFields orders the handshake requests, per event type */
export const REQUESTED_EVENT_FIELDS: Record<string, string[]> = {
  Quote: QUOTE_EVENT_FIELDS,
  Trade: TRADE_EVENT_FIELDS,
  TradeETH: TRADE_EVENT_FIELDS,
}

/**
 * quoteRecordToResult and TradeProcessor read COMPACT records at fixed indices
 * derived from the requested acceptEventFields order (the order is
 * live-verified, so fixed indices — not a dynamic index map — are correct).
 * A provider-accepted FEED_CONFIG whose field ORDER diverges from the request
 * would therefore silently misread price, size, time and exchange codes: the
 * assertion below is the guard that turns that class loud. Event types the
 * provider did not echo back simply yield no data and are not asserted.
 */
export const assertAcceptedEventFields = (
  accepted: Record<string, string[]>,
  requested: Record<string, string[]> = REQUESTED_EVENT_FIELDS,
): void => {
  for (const [eventType, acceptedFields] of Object.entries(accepted)) {
    const requestedFields = requested[eventType]
    if (requestedFields && acceptedFields.join(',') !== requestedFields.join(',')) {
      throw new Error(
        `Accepted FEED_CONFIG eventFields for ${eventType} diverge from the requested acceptEventFields order: [${acceptedFields.join(
          ', ',
        )}]`,
      )
    }
  }
}

/** Spec keepalive: KEEPALIVE frame on channel 0, every WS_HEARTBEAT_INTERVAL_MS (30s) */
export const dxLinkKeepaliveMessage = (): DxLinkMessage => ({
  type: 'KEEPALIVE',
  channel: 0,
})

/** Spec data_source_authentication.usage.handshake_header */
export const dxLinkConnectionOptions = (settings: {
  API_USERNAME?: string
  API_PASSWORD?: string
}): { headers: { Authorization: string } } => {
  // Fail loud instead of base64-encoding a literal "undefined:undefined" (or a
  // blank value) into the handshake header — defense in depth behind the
  // required-settings gate and the WS-path request-time check
  if (!settings.API_USERNAME?.trim() || !settings.API_PASSWORD?.trim()) {
    throw new Error(
      'API_USERNAME and API_PASSWORD must both be set to build the dxLink Basic Authorization header',
    )
  }
  const encodedCreds = Buffer.from(`${settings.API_USERNAME}:${settings.API_PASSWORD}`).toString(
    'base64',
  )
  return { headers: { Authorization: `Basic ${encodedCreds}` } }
}

export type DxLinkConnection = {
  send: (data: string) => void
  addEventListener: (
    event: 'message' | 'close',
    listener: (event: { data?: unknown; code?: number }) => void,
  ) => void
  // Optional: the framework's ws client implements it; minimal test fakes may not
  removeEventListener?: (
    event: 'message' | 'close',
    listener: (event: { data?: unknown; code?: number }) => void,
  ) => void
  // The framework's ws client implements close(): an in-band CHANNEL_CLOSED
  // frame tears the socket down so the framework runs its reconnect +
  // resubscribe path; minimal test fakes may not implement it
  close?: () => void
}

/**
 * Explicit numeric field conversion (precision rule). Upstream,
 * parseCompactFeedData has already converted the JSON string "NaN" to NaN and
 * stripped \x00 padding from string fields; any OTHER string value reaches
 * parseNumeric and returns NaN — no string is ever coerced to a number. The
 * fixed-index readers never read a string field as numeric, because
 * assertAcceptedEventFields pins the FEED_CONFIG field order to the requested
 * acceptEventFields, so the numeric positions (time, price, sizes) always hold
 * JSON numbers.
 */
export const parseNumeric = (value: unknown): number => {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : NaN
  return parsed
}

/**
 * dxLink handshake open gate (finalto quote.ts pattern): send SETUP,
 * CHANNEL_REQUEST and FEED_SETUP, then resolve only once FEED_CONFIG arrives —
 * the whole sequence must fit WS_CONNECTION_OPEN_TIMEOUT. An ERROR frame from
 * the provider (e.g. unauthorized) or a connection close before FEED_CONFIG
 * rejects immediately instead of waiting out the timeout. settle() removes the
 * open-gate listeners, so the FEED_CONFIG field layout is handed to the caller
 * and every later frame is handled — and parsed — exactly once by the regular
 * transport message handler.
 *
 * The open budget itself is framework timing: the caller's WS_CONNECTION_OPEN
 * budget is enforced with the framework's timeoutPromise helper (the same
 * helper the framework's establishWsConnection races the open handler against),
 * so no raw timer lives in adapter code and test harnesses control the clock.
 */
export const openDxLinkConnection = (
  connection: DxLinkConnection,
  onFeedConfig?: (eventFields: Record<string, string[]>) => void,
  openTimeoutMs?: number,
): Promise<void> => {
  // Settle handle for the open gate, so the timeout race below can run the SAME
  // settle path (which removes the open-gate listeners) the gate's own
  // rejections run. Assigned synchronously by the executor below — always set
  // by the time the timeout race's catch can call it.
  let settleGate: ((error?: Error) => void) | undefined

  const gate = new Promise<void>((resolve, reject) => {
    let settled = false

    const onMessage = (event: { data?: unknown }) => {
      let message: DxLinkMessage
      try {
        message = JSON.parse(String(event.data))
      } catch {
        return
      }
      if (settled) {
        return
      }
      if (message.type === 'ERROR') {
        settle(
          new Error(
            `dxLink ERROR message during handshake: ${
              message.message ?? message.code ?? 'unknown error'
            }`,
          ),
        )
        return
      }
      if (message.type === 'FEED_CONFIG') {
        logger.info('dxLink handshake complete: FEED_CONFIG received')
        onFeedConfig?.(message.eventFields ?? {})
        settle()
      }
    }

    // A provider that drops the connection before FEED_CONFIG (e.g. rejected
    // credentials) fails the handshake immediately — settle() no-ops once the
    // gate has settled, so post-handshake closes are left to the framework
    const onClose = (event: { code?: number }) =>
      settle(
        new Error(`dxLink connection closed before FEED_CONFIG (code ${event.code ?? 'unknown'})`),
      )

    const settle = (error?: Error) => {
      if (settled) {
        return
      }
      settled = true
      // The open-gate listeners must not outlive the handshake: leaving them
      // attached would JSON.parse every later frame a second time for the
      // connection's lifetime, the transport handler being the sole parser
      connection.removeEventListener?.('message', onMessage)
      connection.removeEventListener?.('close', onClose)
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }
    settleGate = settle

    connection.addEventListener('message', onMessage)
    connection.addEventListener('close', onClose)

    for (const message of dxLinkHandshakeMessages()) {
      connection.send(JSON.stringify(message))
    }
  })

  if (openTimeoutMs === undefined) {
    return gate
  }
  return timeoutPromise('dxLink handshake', gate, openTimeoutMs).catch((error) => {
    // Relabel only the budget exhaustion (the framework helper's timeout
    // rejection); a gate rejection of its own (ERROR frame, close) keeps its
    // original message
    if (error instanceof Error && error.message.includes('took longer than')) {
      const timeoutError = new Error(
        `dxLink handshake did not complete within ${openTimeoutMs}ms (no FEED_CONFIG received)`,
      )
      // Settle the gate with the timeout error so its settle path removes the
      // open-gate message and close listeners — one cleanup path covers both
      // outcomes (the former code rejected without settling, leaving the
      // listeners attached for the connection's lifetime)
      settleGate?.(timeoutError)
      throw timeoutError
    }
    throw error
  })
}

export const parseCompactFeedData = (
  eventType: string,
  data: DxLinkRecord,
  eventFields: Record<string, string[]>,
): DxLinkRecord[] => {
  const width = eventFields[eventType]?.length ?? 0
  if (!width) {
    logger.warn(`No FEED_CONFIG eventFields for event type ${eventType}; dropping FEED_DATA frame`)
    return []
  }

  const completeRecords = Math.floor(data.length / width)
  if (completeRecords * width < data.length) {
    logger.warn(
      `Truncating trailing partial ${eventType} record (${data.length % width} of ${width} fields)`,
    )
  }

  const records: DxLinkRecord[] = []
  for (let i = 0; i < completeRecords; i++) {
    records.push(
      data.slice(i * width, (i + 1) * width).map((value) => {
        if (typeof value !== 'string') {
          return value
        }
        const stripped = value.split('\x00').join('')
        // Spec valueRangeScalingNotes: the JSON string "NaN" marks the value invalid
        return stripped === 'NaN' ? NaN : stripped
      }),
    )
  }
  return records
}

const wireKey = (entry: DxLinkSubscriptionEntry) => `${entry.type}:${entry.symbol}`

const dedupeEntries = (entries: DxLinkSubscriptionEntry[]): DxLinkSubscriptionEntry[] => {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    const key = wireKey(entry)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Raw per-subscription response before the framework's {params, response}
 * wrapping: either a mapped provider record or a 502 error result.
 */
export type DxLinkRawResult = {
  statusCode?: number
  errorMessage?: string
  result?: number | null
  data?: unknown
  timestamps?: { providerIndicatedTimeUnixMs?: number }
}

export type DxLinkFeedDeps<T extends DxLinkTransportGenerics> = {
  /** Maps validated request params onto the (symbol, eventType) feed entries to subscribe */
  formatTickers: (params: TypeFromDefinition<T['Parameters']>) => DxLinkSubscriptionEntry[]
  /** Turns one COMPACT record into a cache result for the given subscription params (or drops it) */
  processRecord: (
    eventType: string,
    record: DxLinkRecord,
    params: TypeFromDefinition<T['Parameters']>,
  ) => DxLinkRawResult | undefined
  /**
   * Notified with the wire entries whose SYMBOL has no desired subscription
   * left on ANY event type after a FEED_SUBSCRIPTION remove message is built —
   * the customSubscriptionMessages remove path, where per-symbol state can be
   * cleaned up so it cannot grow without bound across subscription churn.
   * Trade and TradeETH share one newest-time entry per symbol, so a Trade-only
   * removal with TradeETH still desired reports nothing.
   */
  onUnsubscribe?: (entries: DxLinkSubscriptionEntry[]) => void
}

export class DxLinkFeed<T extends DxLinkTransportGenerics = DxLinkTransportGenerics> {
  private eventFields: Record<string, string[]> = {}
  private subsByWireKey = new Map<string, TypeFromDefinition<T['Parameters']>[]>([])
  private connection?: DxLinkConnection

  constructor(private readonly deps: DxLinkFeedDeps<T>) {}

  /**
   * Captured from the transport's open handler — re-captured on every
   * reconnect — so an in-band CHANNEL_CLOSED frame can close the socket. The
   * framework WebSocketTransport owns the reconnect + resubscribe cycle that
   * must follow (it re-delivers the full desired set as subscriptions.new).
   */
  setConnection(connection: DxLinkConnection): void {
    this.connection = connection
  }

  onFeedConfig(eventFields: Record<string, string[]> | undefined): void {
    const accepted = eventFields ?? {}
    // Each FEED_CONFIG frame is routed to exactly one handler — but the SAME
    // handshake frame that settles the open gate can still be dispatched to
    // handlers.message afterwards, so an identical re-assertion is a no-op
    // (plan feed-config-double-handling), not a second accept
    if (
      Object.keys(this.eventFields).length > 0 &&
      JSON.stringify(this.eventFields) === JSON.stringify(accepted)
    ) {
      return
    }
    try {
      assertAcceptedEventFields(accepted)
    } catch (error) {
      // A FEED_CONFIG diverging from the requested layout is an error — but the
      // LAST ACCEPTED eventFields are kept, not cleared: clearing them would
      // drop every later FEED_DATA frame silently (plan
      // feed-config-double-handling)
      logger.error(
        `dxLink FEED_CONFIG rejected: ${
          (error as Error).message
        }; keeping the last accepted eventFields`,
      )
      return
    }
    this.eventFields = accepted
  }

  /**
   * Builds FEED_SUBSCRIPTION add/remove messages. Rebuilds the reverse index
   * from the full desired set — O(desired) — but ONLY on a subscription delta:
   * the pinned framework (2.20.0) invokes customSubscriptionMessages solely
   * inside its subscription-diff branch, so a background execution with an
   * unchanged desired set never calls this and emits no frames. On reconnect
   * the framework delivers the whole desired set as `new`, so the add messages
   * resubscribe it.
   */
  subscriptionMessages(
    subscriptions: SubscriptionDeltas<TypeFromDefinition<T['Parameters']>>,
  ): DxLinkMessage[] {
    this.subsByWireKey = new Map()
    const desiredKeys = new Set<string>()
    // Newest-time state is shared across event types (the price transport's
    // TradeProcessor keeps ONE per-symbol entry that both Trade and TradeETH
    // read and write), so the unsubscribe notification below fires only for a
    // symbol with no desired subscription left on ANY event type
    const desiredSymbols = new Set<string>()
    const stale = subscriptions.stale ?? []
    const newSubs = subscriptions.new ?? []
    for (const params of subscriptions.desired) {
      for (const entry of this.deps.formatTickers(params)) {
        const key = wireKey(entry)
        desiredKeys.add(key)
        desiredSymbols.add(entry.symbol)
        const subs = this.subsByWireKey.get(key)
        if (subs) {
          subs.push(params)
        } else {
          this.subsByWireKey.set(key, [params])
        }
      }
    }

    // Never unsubscribe a wire key still desired by another params combo
    const remove = dedupeEntries(
      stale
        .flatMap((params) => this.deps.formatTickers(params))
        .filter((entry) => !desiredKeys.has(wireKey(entry))),
    )
    const add = dedupeEntries(newSubs.flatMap((params) => this.deps.formatTickers(params)))

    const messages: DxLinkMessage[] = []
    if (remove.length > 0) {
      messages.push({ type: 'FEED_SUBSCRIPTION', channel: DXLINK_FEED_CHANNEL, remove })
      // The remove list already excludes wire keys still desired by another
      // params combo. The symbol-level filter additionally excludes entries
      // whose SYMBOL is still desired on another event type — removing the last
      // Trade subscription while TradeETH stays desired shares the symbol's
      // newest-time state, so that symbol is not reported unsubscribed.
      this.deps.onUnsubscribe?.(remove.filter((entry) => !desiredSymbols.has(entry.symbol)))
    }
    if (add.length > 0) {
      messages.push({ type: 'FEED_SUBSCRIPTION', channel: DXLINK_FEED_CHANNEL, add })
    }
    return messages
  }

  /**
   * FEED_DATA frames fan out to every desired subscription mapped onto the
   * record's wire key; ERROR/KEEPALIVE/CHANNEL_CLOSED control frames produce
   * no results (owner decision degraded_stream_alerting=metrics_counters_only).
   */
  message(
    message: DxLinkMessage,
  ): (DxLinkRawResult & { params: TypeFromDefinition<T['Parameters']> })[] {
    switch (message.type) {
      case 'FEED_CONFIG':
        this.onFeedConfig(message.eventFields)
        return []
      case 'FEED_DATA':
        return this.onFeedData(message)
      case 'ERROR':
        logger.warn(`dxLink ERROR (code ${message.code}): ${message.message}`)
        return []
      case 'CHANNEL_CLOSED':
        logger.warn(
          `dxLink channel ${message.channel} closed by the server for ${
            message.eventType ?? 'all events'
          } ${
            message.symbol ?? ''
          }: closing the WebSocket so the framework reconnects and resubscribes (the cached last value serves during the reconnect window)`,
        )
        // An in-band CHANNEL_CLOSED frame carries no socket handle — closing
        // the WebSocket here makes the framework run its reconnect and
        // resubscribe path (on reconnect subscriptions.new = the full desired
        // set); the response cache serves the last value during that window
        // (owner decision reconnect_cache_behavior=serve_cached_last_value)
        this.connection?.close?.()
        return []
      case 'KEEPALIVE':
        return []
      default:
        return []
    }
  }

  private onFeedData(
    message: DxLinkMessage,
  ): (DxLinkRawResult & { params: TypeFromDefinition<T['Parameters']> })[] {
    const eventType = message.data?.[0]
    const data = message.data?.[1]
    if (typeof eventType !== 'string' || !Array.isArray(data)) {
      logger.warn(`Ignoring malformed FEED_DATA frame: ${JSON.stringify(message)}`)
      return []
    }

    const eventSymbolIndex = this.eventFields[eventType]?.indexOf('eventSymbol') ?? -1
    if (eventSymbolIndex < 0) {
      logger.warn(`No FEED_CONFIG eventFields for ${eventType}; dropping FEED_DATA frame`)
      return []
    }

    // COMPACT frames carry the records' fields concatenated flat; a frame may
    // also arrive as a list of record arrays — both normalize to one flat array
    const flatData = data.flatMap((value) => (Array.isArray(value) ? value : [value]))

    const records = parseCompactFeedData(eventType, flatData, this.eventFields)
    // With acceptAggregationPeriod=1 the provider concatenates several records
    // per frame. Every event type — Quote included — processes each record and
    // the LAST record per wire key wins: it is the freshest update in the frame
    // (spec response_mapping processes each record; the reference adapter's
    // one-stream-per-symbol behavior serves the newest data). NOTE: the
    // generated golden vector test (test/golden/stock_quotes.test.ts,
    // agent-unwritable) still maps the FIRST record of the spec sample frame —
    // a spec-versus-golden conflict flagged to the spec owner for re-gating.
    const selectedPerWireKey = new Map<string, DxLinkRecord>()
    for (const record of records) {
      selectedPerWireKey.set(`${eventType}:${record[eventSymbolIndex]}`, record)
    }

    return [...selectedPerWireKey.values()].flatMap((record) => {
      const subs = this.subsByWireKey.get(`${eventType}:${record[eventSymbolIndex]}`) ?? []
      return subs
        .map((params) => {
          const result = this.deps.processRecord(eventType, record, params)
          return result === undefined ? undefined : { ...result, params }
        })
        .filter(
          (result): result is DxLinkRawResult & { params: TypeFromDefinition<T['Parameters']> } =>
            result !== undefined,
        )
    })
  }
}
