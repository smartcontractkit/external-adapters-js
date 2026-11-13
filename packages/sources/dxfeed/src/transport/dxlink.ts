import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import {
  WebSocket,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports/websocket'
import {
  makeLogger,
  ProviderResult,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import type { config } from '../config'
import { toNumber } from './utils'

const logger = makeLogger('DxLinkTransport')

const CONTROL_CHANNEL = 0
const FEED_CHANNEL = 1
const COMPACT = 'COMPACT'
const TIMEOUT_ERROR = 'TIMEOUT'

const SETUP_MESSAGE = {
  type: 'SETUP',
  channel: CONTROL_CHANNEL,
  version: '0.1-js/1.0.0',
  keepaliveTimeout: 60,
  acceptKeepaliveTimeout: 60,
}

const CHANNEL_REQUEST_MESSAGE = {
  type: 'CHANNEL_REQUEST',
  channel: FEED_CHANNEL,
  service: 'FEED',
  parameters: { contract: 'AUTO' },
}

const KEEPALIVE_MESSAGE = { type: 'KEEPALIVE', channel: CONTROL_CHANNEL }

const EVENT_FIELDS = {
  Quote: [
    'eventType',
    'eventSymbol',
    'eventTime',
    'bidPrice',
    'askPrice',
    'bidSize',
    'askSize',
    'bidExchangeCode',
    'askExchangeCode',
  ],
  Trade: ['eventType', 'eventSymbol', 'eventTime', 'price'],
  TradeETH: ['eventType', 'eventSymbol', 'eventTime', 'price'],
}

export type DxLinkEventType = keyof typeof EVENT_FIELDS

export type DxLinkEvent = {
  eventType: DxLinkEventType
  eventSymbol: string
  eventTime?: number
  time?: number
  [field: string]: unknown
}

type DxLinkMessage = {
  type: string
  channel: number
  eventFields?: Record<string, string[]>
  dataFormat?: string
  data?: unknown[]
  error?: string
  message?: string
  state?: string
}

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: typeof config.settings
}

export type DxLinkTransportTypes<T extends BaseTransportTypes> = T & {
  Provider: { WsMessage: DxLinkMessage }
}

type HandshakeStage = 'setup' | 'channel' | 'feed'

const feedSetupMessage = (eventTypes: DxLinkEventType[]) => ({
  type: 'FEED_SETUP',
  channel: FEED_CHANNEL,
  acceptAggregationPeriod: 1,
  acceptDataFormat: COMPACT,
  acceptEventFields: Object.fromEntries(eventTypes.map((type) => [type, EVENT_FIELDS[type]])),
})

const parseMessage = (data: WebSocket.Data): DxLinkMessage | undefined => {
  try {
    return JSON.parse(data.toString()) as DxLinkMessage
  } catch {
    return undefined
  }
}

const compactFields = (
  message: DxLinkMessage,
  eventTypes: DxLinkEventType[],
): Map<string, string[]> | undefined => {
  if (message.dataFormat !== COMPACT) {
    return undefined
  }
  const entries = Object.entries(message.eventFields ?? {}) as [string, string[]][]
  const fields = new Map(entries.filter(([, value]) => Array.isArray(value) && value.length > 0))
  return eventTypes.every((type) => fields.has(type)) ? fields : undefined
}

export const eventTimeOf = (event: DxLinkEvent): number | null =>
  toNumber(event.eventTime) ?? toNumber(event.time)

export abstract class DxLinkTransport<T extends BaseTransportTypes> extends WebSocketTransport<
  DxLinkTransportTypes<T>
> {
  private fieldsByEventType = new Map<string, string[]>()
  private latestEventTimes = new Map<string, number>()

  protected abstract parseEvent(event: DxLinkEvent): ProviderResult<DxLinkTransportTypes<T>>[]

  constructor(private readonly eventTypes: DxLinkEventType[]) {
    super({
      url: (context) => context.adapterSettings.WS_API_ENDPOINT || '',
      options: ({ adapterSettings: { API_USERNAME, API_PASSWORD } }) => ({
        headers: {
          Authorization: `Basic ${Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString(
            'base64',
          )}`,
        },
      }),
      handlers: {
        open: (connection, context) =>
          this.handshake(connection, context.adapterSettings.WS_CONNECTION_OPEN_TIMEOUT),
        message: (message) => this.handleMessage(message),
        heartbeat: (connection) => connection.send(JSON.stringify(KEEPALIVE_MESSAGE)),
      },
      builders: {
        customSubscriptionMessages: (_context, subscriptions) =>
          this.subscriptionMessages(subscriptions),
      },
    })
  }

  private handshake(connection: WebSocket, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      let stage: HandshakeStage = 'setup'
      let settled = false

      const settle = (error?: Error) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timer)
        connection.removeEventListener('message', onMessage)
        connection.removeEventListener('close', onClose)
        if (!error) {
          resolve()
          return
        }
        connection.close(1000)
        reject(error)
      }

      const send = (message: object) => connection.send(JSON.stringify(message))

      const advance = (next: HandshakeStage, message: object) => {
        stage = next
        send(message)
      }

      const onClose = () => settle(new Error('dxLink connection closed during handshake'))

      const onMessage = (event: WebSocket.MessageEvent) => {
        const message = parseMessage(event.data)
        if (!message) {
          return
        }
        switch (message.type) {
          case 'ERROR':
            settle(new Error(`dxLink handshake failed: ${message.error} ${message.message}`))
            return
          case 'AUTH_STATE':
            if (message.state === 'UNAUTHORIZED') {
              settle(new Error('dxLink handshake unauthorized'))
            }
            return
          case 'SETUP':
            if (stage === 'setup') {
              advance('channel', CHANNEL_REQUEST_MESSAGE)
            }
            return
          case 'CHANNEL_OPENED':
            if (stage === 'channel' && message.channel === FEED_CHANNEL) {
              advance('feed', feedSetupMessage(this.eventTypes))
            }
            return
          case 'FEED_CONFIG': {
            if (stage !== 'feed' || message.channel !== FEED_CHANNEL) {
              return
            }
            const fields = compactFields(message, this.eventTypes)
            if (!fields) {
              settle(new Error('dxLink FEED_CONFIG is not COMPACT or is missing event fields'))
              return
            }
            this.fieldsByEventType = fields
            settle()
            return
          }
          case 'CHANNEL_CLOSED':
            settle(new Error(`dxLink channel ${message.channel} closed during handshake`))
        }
      }

      const timer = setTimeout(() => settle(new Error('dxLink handshake timed out')), timeoutMs)

      connection.addEventListener('message', onMessage)
      connection.addEventListener('close', onClose)
      send(SETUP_MESSAGE)
    })
  }

  private handleMessage(message: DxLinkMessage): ProviderResult<DxLinkTransportTypes<T>>[] {
    switch (message.type) {
      case 'FEED_DATA':
        return this.decodeFeedData(message.data)
          .filter((event) => this.eventTypes.includes(event.eventType))
          .filter((event) => !this.isStale(event))
          .flatMap((event) => this.parseEvent(event))
      case 'FEED_CONFIG':
        return this.applyFeedConfig(message)
      case 'CHANNEL_CLOSED':
        return this.reconnect(`dxLink closed channel ${message.channel}`)
      case 'AUTH_STATE':
        return message.state === 'UNAUTHORIZED' ? this.reconnect('dxLink unauthorized') : []
      case 'ERROR':
        return this.handleProviderError(message)
      default:
        return []
    }
  }

  private applyFeedConfig(message: DxLinkMessage): ProviderResult<DxLinkTransportTypes<T>>[] {
    const fields = compactFields(message, this.eventTypes)
    if (!fields) {
      logger.warn('dxLink FEED_CONFIG changed to an unsupported format; reconnecting')
      this.wsConnection?.close(1000)
      return []
    }
    this.fieldsByEventType = fields
    return []
  }

  private handleProviderError(message: DxLinkMessage): ProviderResult<DxLinkTransportTypes<T>>[] {
    logger.warn(`dxLink error: ${message.error} ${message.message}`)
    metrics
      .get('wsConnectionErrors')
      .labels({ message: message.error ?? 'unknown' })
      .inc()
    if (message.error === TIMEOUT_ERROR) {
      return this.reconnect('dxLink TIMEOUT')
    }
    return []
  }

  private reconnect(reason: string): ProviderResult<DxLinkTransportTypes<T>>[] {
    logger.info(`${reason}; reconnecting`)
    this.wsConnection?.close(1000)
    return []
  }

  private isStale(event: DxLinkEvent): boolean {
    const time = eventTimeOf(event)
    if (time === null) {
      return false
    }
    const latest = this.latestEventTimes.get(event.eventSymbol)
    if (latest !== undefined && time < latest) {
      return true
    }
    this.latestEventTimes.set(event.eventSymbol, time)
    return false
  }

  private subscriptionMessages({
    new: added,
    stale,
    desired,
  }: SubscriptionDeltas<TypeFromDefinition<T['Parameters']>>) {
    const desiredSymbols = toSymbols(desired)
    const add = this.toSubscriptions([...toSymbols(added)])
    const remove = this.toSubscriptions(
      [...toSymbols(stale)].filter((symbol) => !desiredSymbols.has(symbol)),
    )
    if (!add.length && !remove.length) {
      return []
    }
    return [
      {
        type: 'FEED_SUBSCRIPTION',
        channel: FEED_CHANNEL,
        ...(add.length ? { add } : {}),
        ...(remove.length ? { remove } : {}),
      },
    ]
  }

  protected eventTypesForSymbol(symbol: string): DxLinkEventType[] {
    void symbol
    return this.eventTypes
  }

  private toSubscriptions(symbols: string[]) {
    return symbols.flatMap((symbol) =>
      this.eventTypesForSymbol(symbol).map((type) => ({ type, symbol })),
    )
  }

  private decodeFeedData(data: unknown = []): DxLinkEvent[] {
    if (!Array.isArray(data)) {
      logger.warn('Dropping FEED_DATA: data is not an array')
      return []
    }
    return splitArrayIntoChunks(data, 2).flatMap(([eventType, values]) =>
      this.decodeRecords(eventType, values),
    )
  }

  private decodeRecords(eventType: unknown, values: unknown): DxLinkEvent[] {
    const fields = this.fieldsByEventType.get(eventType as string)
    if (!fields || !Array.isArray(values)) {
      logger.warn(`Dropping ${eventType} data: field layout unknown`)
      return []
    }
    return splitArrayIntoChunks(values, fields.length)
      .filter((record) => record.length === fields.length)
      .map(
        (record) =>
          Object.fromEntries(
            fields.map((field, index) => [field, stripNul(record[index])]),
          ) as DxLinkEvent,
      )
      .filter((record) => this.hasSymbol(record))
  }

  private hasSymbol(record: Record<string, unknown>): boolean {
    const valid = typeof record.eventSymbol === 'string' && record.eventSymbol.trim().length > 0
    if (!valid) {
      logger.warn(`Dropping ${String(record.eventType)} record without a symbol`)
    }
    return valid
  }
}

const toSymbols = (params: object[]): Set<string> =>
  new Set(params.map((param) => (param as { base: string }).base.toUpperCase()))

const stripNul = (value: unknown) =>
  typeof value === 'string' ? value.split('\u0000').join('') : value
