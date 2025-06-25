import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { EventEmitter } from 'events'
import { config } from '../../config/'
import { ConnectionType } from './config'
import { window } from './jsApi/jsapi-nodejs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore this should be the single place we do this
const JsApi = window.NetDania.JsApi

const logger = makeLogger('ICE StreamingClient')

type RequestId = number
type Instrument = string
type Provider = string

// from JsApi.Fields
type FieldId = number

type Field = {
  f: FieldId
  v: string
}

/** Response from the server when monitoring prices. */
export type MonitorPriceResponse = {
  type: number
  id: RequestId
  data: Field[]
  modifiedFids: FieldId[]
}

type MonitorPriceRequest = {
  t: 1
  i: RequestId
  m: boolean
  s: Instrument
  p: Provider
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type ErrorResponse = JsApi.Application.ErrorResponse & {
  type: number
  id: number
  code: string
}

enum Events {
  ONCONNECTED = 'OnConnected',
  ONDISCONNECTED = 'OnDisconnected',
  ONINIT = 'OnInit',
  ONRECONNECTED = 'OnReconnect',
  ONPRICEUPDATE = 'OnPriceUpdate',
  ONERROR = 'OnError',
} // and others, from JsApi.Events

export class Utils {
  static readonly BID: FieldId = JsApi.Fields.QUOTE_BID
  static readonly ASK: FieldId = JsApi.Fields.QUOTE_ASK
  static readonly MID_PRICE: FieldId = JsApi.Fields.QUOTE_MID_PRICE
  static readonly TIME_STAMP: FieldId = JsApi.Fields.QUOTE_TIME_STAMP
  static readonly TIME_ZONE: FieldId = JsApi.Fields.QUOTE_TIME_ZONE

  private static getField(data: Field[], fieldId: FieldId): string | null {
    const field = data.find((f) => f.f === fieldId)
    if (field) {
      return field.v
    } else {
      return null
    }
  }

  static mkPartialPriceUpdate(priceResponse: MonitorPriceResponse): PartialPriceUpdate | null {
    if (priceResponse.type !== 2) {
      throw new Error(`Not a price response, type is ${priceResponse.type}, expected 2.`)
    }
    const ts = Utils.getField(priceResponse.data, Utils.TIME_STAMP)
    if (ts === 'N/A') {
      throw new Error("Invalid timestamp 'N/A'. Cannot create PartialPriceUpdate.")
    }

    const bid = Utils.getField(priceResponse.data, Utils.BID)
    const ask = Utils.getField(priceResponse.data, Utils.ASK)
    const mid = Utils.getField(priceResponse.data, Utils.MID_PRICE)
    const tz = Utils.getField(priceResponse.data, Utils.TIME_ZONE)

    // if none of the above are present, this update is void, return null
    if (bid === null && ask === null && mid === null && tz === null) {
      return null
    }

    // an update with null ts is still valid; it just has the same timestamp as the previous one
    return {
      ts: ts !== null ? parseInt(ts) : undefined,
      bid: bid !== null ? parseFloat(bid) : undefined,
      ask: ask !== null ? parseFloat(ask) : undefined,
      mid: mid !== null ? parseFloat(mid) : undefined,
      timezone: tz !== null ? tz : undefined,
    } as PartialPriceUpdate
  }
}

/** Our view of the (partial) updates we receive from the server. */
export type PartialPriceUpdate = {
  ask?: number
  bid?: number
  mid?: number
  ts?: number
  timezone?: string
}

// make EventEmitter more strongly typed with the types of the events we emit
export type InstrumentPartialUpdate = {
  instrument: Instrument
  data: PartialPriceUpdate
}

/**
 * This wraps the jsAPi client library and exposes a subscription oriented event emitter interface.
 *
 * Nowhere else should any jsApi constructs be directly visible.
 *
 * It accepts subscriptions to instruments, and emits partial updates to them. These should be
 * managed (merged, cached) by the consumer.
 *
 * It tries to keep the connection alive.
 *
 * Any change to subscriptions will not take effect until refresh().
 */
export class StreamingClient extends EventEmitter {
  // TODO how to get rid of this 'cannot find namespace' error?
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private connection: JsApi.JSONConnection
  private requestIdToInstrument: Map<RequestId, Instrument> = new Map()

  constructor(public readonly cfg: typeof config.settings) {
    super()

    this.connection = new JsApi.JSONConnection({
      host: cfg.API_ENDPOINT,
      failoverHosts: [cfg.FAILOVER_API_ENDPOINT],
      behavior: ConnectionType.POLLING,
      pollingInterval: cfg.POLLING_INTERVAL,
      usergroup: cfg.USER_GROUP,
      password: cfg.NETDANIA_PASSWORD,
    })

    this.connection.addListener(Events.ONINIT, function (info: string) {
      logger.info('ONINIT:' + info + '\n')
    })

    this.connection.addListener(Events.ONCONNECTED, (sessionId: string) => {
      // Upon successful connection and receipt of a session ID, instruments can be requested.
      logger.debug('ONCONNECTED:' + sessionId)
    })

    this.connection.addListener(Events.ONRECONNECTED, (sessionId: string) => {
      // does a reconnect bring a new sessionId?
      logger.debug('ONRECONNECTED:' + sessionId)
      logger.debug(`is connected? ${this.connection.isConnected()}`)
    })

    // triggered when the client is disconnected from the server, followed by an automatic reconnection attempt.
    this.connection.addListener(Events.ONDISCONNECTED, (msg: string, url: string) => {
      // Log the disconnection message and URL for reference.
      logger.warn('ONDISCONNECTED:' + msg + ' ' + url + '\n')
      logger.debug(`is connected? ${this.connection.isConnected()}`)
    })

    this.connection.addListener(Events.ONERROR, this.onErrorHandler)
    this.connection.addListener(Events.ONPRICEUPDATE, this.onPriceUpdateHandler)
  }

  /**
   * Event listener triggered when an error occurs during the connection.
   *
   * @param {JsApi.Application.ErrorResponse} ev
   *  - Object containing the error information
   *    - code: error code (GENERAL_CODE_UNAVAILABLE: -128, GENERAL_CODE_NOT_ALLOWED: -127)
   *    - id: Request ID used to identify the instrument this response is referring to.
   *    - type: 20
   */
  onErrorHandler = (ev: ErrorResponse) => {
    logger.error('ONERROR:' + JSON.stringify(ev) + '\n')
    switch (ev.code) {
      case -127:
        logger.debug('instrument not allowed' + '\n')
        break
      case -128:
        logger.debug('instrument not available' + '\n')
        break
      default:
        logger.debug('error code: ' + ev.code + '\n')
    }
  }

  /**
   * Event listener triggered when a new price update is received from the server.
   *
   * @param {MonitorPriceResponse} priceUpdate - Object containing the price update information
   *    - type: 2 for price updates
   *    - id: Request ID used to identify the instrument this response is referring to.
   *    - data: Array of fields with their values
   *    - modifiedFids: Array of field IDs that were modified in this update
   * @emits InstrumentPartialUpdate
   */
  onPriceUpdateHandler = (priceUpdate: MonitorPriceResponse) => {
    logger.debug(`onPriceUpdateHandler ${priceUpdate.id}`)
    logger.trace(JSON.stringify(priceUpdate, null, 0))
    const instrument = this.requestIdToInstrument.get(priceUpdate.id)
    if (!instrument) {
      logger.error('Could not find instrument for price update: ', JSON.stringify(priceUpdate))
    } else {
      try {
        const update = Utils.mkPartialPriceUpdate(priceUpdate)
        if (update) {
          this.emit('price', {
            instrument: instrument,
            data: update,
          })
        }
      } catch (e) {
        logger.error(e, 'Error emitting price update: ', JSON.stringify(priceUpdate))
      }
    }
  }

  public async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        logger.error('Connecting timed out.')
        reject(new Error('Connection timeout'))
      }, this.cfg.CONNECTING_TIMEOUT_MS)

      this.connection.addListener(Events.ONERROR, (error: ErrorResponse) => {
        clearTimeout(timeout)
        logger.error('Connection error:', error)
        reject(error)
      })

      this.connection.addListener(Events.ONCONNECTED, () => {
        clearTimeout(timeout)
        resolve()
      })

      this.connection.Connect()
      this.flush()
    })
  }

  public async disconnect(): Promise<void> {
    this.connection._tryReconnect = false // disable auto-reconnect
    this.connection.disconnect()
  }

  public async flush(): Promise<void> {
    this.connection.Flush()
  }

  private monitorPriceRequest(instrument: string, provider: string): MonitorPriceRequest {
    return JsApi.Request.getReqObjPrice(instrument, provider, true, null)
  }

  public getActiveInstruments(): Instrument[] {
    const underlyingInstruments = this.connection
      .GetRequestList()
      .map((r: MonitorPriceRequest) => r.s)
    const own = Array.from(this.requestIdToInstrument.values())
    if (underlyingInstruments !== own) {
      logger.warn(
        'ICE: Netdania transport: drift detected between underlying instruments and our own.',
      )
    }
    return own
  }

  /**
   * Adds instruments to the connection and returns their request IDs, skipping any that are already added.
   * @param instruments - Array of instrument strings to monitor.
   * @param provider - Underlying provider of prices, defaults to "idc".
   * @returns Array of RequestId corresponding to the newly added instruments.
   */
  public async addInstruments(instruments: string[], provider = 'idc'): Promise<Instrument[]> {
    const existingInstruments = new Set(this.requestIdToInstrument.values()) // values is unique only by construction
    const instrumentsToAdd: Set<string> = new Set(
      [...instruments].filter((x) => !existingInstruments.has(x)),
    )

    const reqs = Array.from(instrumentsToAdd).map((i) => this.monitorPriceRequest(i, provider))
    this.connection.addRequests(reqs)
    // add result to requestIdToInstrument map
    for (const req of reqs) {
      this.requestIdToInstrument.set(req.i, req.s)
    }

    return reqs.map((req) => req.s)
  }

  public async removeInstruments(instruments: Instrument[]): Promise<void> {
    const existingInstruments = new Set(this.requestIdToInstrument.values())
    const instrumentsToRemove = instruments.filter((i) => existingInstruments.has(i))
    if (instrumentsToRemove.length === 0) {
      logger.warn('removeInstruments(): Nothing to do. Either all already removed or never added.')
    } else {
      const requestIdsToRemove = Array.from(this.requestIdToInstrument.entries())
        .filter((entry) => instrumentsToRemove.includes(entry[1]))
        .map((entry) => entry[0])
      this.connection.RemoveRequests(requestIdsToRemove)
      requestIdsToRemove.forEach((id) => this.requestIdToInstrument.delete(id))
      await this.flush()
    }
  }
}
