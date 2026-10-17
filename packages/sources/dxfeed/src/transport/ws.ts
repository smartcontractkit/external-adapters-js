import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'

const logger = makeLogger('DxLink Websocket')

/**
 * dxLink wire protocol (https://docs.dxfeed.com/dxlink-ws/), spec OPDATA-9200.
 * Replaces the adapter's deleted legacy session transport (the spec's
 * transport-deletion exception; see src/config for the startup env check).
 * Built on the framework's WebSocketTransport mechanisms.
 */
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
  // COMPACT FEED_DATA: [eventType, flat array of concatenated fixed-width records]
  data?: [string, DxLinkRecord]
  add?: DxLinkSubscriptionEntry[]
  remove?: DxLinkSubscriptionEntry[]
  symbol?: string
  eventType?: string
  message?: string
  code?: string
}

export type DxLinkProviderTypes = {
  Provider: {
    WsMessage: DxLinkMessage
  }
}

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: TransportGenerics['Settings'] & typeof config.settings
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
  const encodedCreds = Buffer.from(`${settings.API_USERNAME}:${settings.API_PASSWORD}`).toString(
    'base64',
  )
  return { headers: { Authorization: `Basic ${encodedCreds}` } }
}

export type DxLinkConnection = {
  send: (data: string) => void
  addEventListener: (event: 'message', listener: (event: { data: unknown }) => void) => void
}

/**
 * dxLink handshake open gate (finalto quote.ts pattern): send SETUP,
 * CHANNEL_REQUEST and FEED_SETUP, then resolve only once FEED_CONFIG arrives —
 * the whole sequence must fit WS_CONNECTION_OPEN_TIMEOUT, and an ERROR frame
 * from the provider (e.g. unauthorized) rejects immediately instead of waiting
 * out the timeout. The open listeners are removed once open resolves, so the
 * FEED_CONFIG field layout is handed to the caller and all later frames go
 * through the regular message handler.
 */
export const openDxLinkConnection = (
  connection: DxLinkConnection,
  onFeedConfig?: (eventFields: Record<string, string[]>) => void,
  openTimeoutMs?: number,
): Promise<void> =>
  new Promise((resolve, reject) => {
    let settled = false
    const settle = (error?: Error) => {
      if (settled) {
        return
      }
      settled = true
      if (openTimeout) {
        clearTimeout(openTimeout)
      }
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }

    let openTimeout: NodeJS.Timeout | undefined
    if (openTimeoutMs !== undefined) {
      openTimeout = setTimeout(
        () =>
          settle(
            new Error(
              `dxLink handshake did not complete within ${openTimeoutMs}ms (no FEED_CONFIG received)`,
            ),
          ),
        openTimeoutMs,
      )
    }

    connection.addEventListener('message', (event) => {
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
    })

    for (const message of dxLinkHandshakeMessages()) {
      connection.send(JSON.stringify(message))
    }
  })

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
}

export class DxLinkFeed<T extends DxLinkTransportGenerics = DxLinkTransportGenerics> {
  private eventFields: Record<string, string[]> = {}
  private subsByWireKey = new Map<string, TypeFromDefinition<T['Parameters']>[]>()

  constructor(private readonly deps: DxLinkFeedDeps<T>) {}

  onFeedConfig(eventFields: Record<string, string[]> | undefined): void {
    this.eventFields = eventFields ?? {}
  }

  /**
   * Builds FEED_SUBSCRIPTION add/remove messages. Rebuilds the reverse index
   * from the full desired set every cycle (the framework calls this on every
   * background execution, delta or not). On reconnect the framework delivers
   * the whole desired set as `new`, so the add messages resubscribe it.
   */
  subscriptionMessages(
    subscriptions: SubscriptionDeltas<TypeFromDefinition<T['Parameters']>>,
  ): DxLinkMessage[] {
    this.subsByWireKey = new Map()
    const desiredKeys = new Set<string>()
    const stale = subscriptions.stale ?? []
    const newSubs = subscriptions.new ?? []
    for (const params of subscriptions.desired) {
      for (const entry of this.deps.formatTickers(params)) {
        const key = wireKey(entry)
        desiredKeys.add(key)
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
          `dxLink channel ${message.channel} closed for ${message.eventType ?? 'all events'} ${
            message.symbol ?? ''
          }; the framework will reconnect and resubscribe the desired set`,
        )
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
    // The spec's stock_quotes sample_response frame concatenates two Quote
    // records for the same symbol, and its canonical response example maps the
    // FIRST one; later records for an already-seen wire key in the same frame
    // are dropped (newer values arrive in later frames).
    const firstRecordPerWireKey = new Map<string, DxLinkRecord>()
    for (const record of records) {
      const key = `${eventType}:${record[eventSymbolIndex]}`
      if (!firstRecordPerWireKey.has(key)) {
        firstRecordPerWireKey.set(key, record)
      }
    }

    return [...firstRecordPerWireKey.values()].flatMap((record) => {
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

export function buildDxLinkWsTransport<T extends BaseTransportTypes>(
  deps: DxLinkFeedDeps<T & DxLinkProviderTypes>,
): WebSocketTransport<T & DxLinkProviderTypes> {
  const feed = new DxLinkFeed<T & DxLinkProviderTypes>(deps)

  return new WebSocketTransport<T & DxLinkProviderTypes>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT || '',

    options: (context) => dxLinkConnectionOptions(context.adapterSettings),

    handlers: {
      open: async (connection, context) => {
        await openDxLinkConnection(
          connection,
          (fields) => feed.onFeedConfig(fields),
          context.adapterSettings.WS_CONNECTION_OPEN_TIMEOUT,
        )
      },

      heartbeat: (connection) => {
        connection.send(JSON.stringify(dxLinkKeepaliveMessage()))
      },

      message: (message) =>
        feed
          .message(message)
          .map(
            ({ params, ...response }) =>
              ({ params, response } as ProviderResult<T & DxLinkProviderTypes>),
          ),
    },

    builders: {
      customSubscriptionMessages: (_context, subscriptions) =>
        feed.subscriptionMessages(subscriptions),
    },
  })
}
