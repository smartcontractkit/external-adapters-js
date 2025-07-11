import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { EventEmitter } from 'events'
import { BaseEndpointTypes } from '../../endpoint/price'
import { window } from './jsApi/jsapi-nodejs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore this should be the single place we do this
const JsApi = window.NetDania.JsApi

const logger = makeLogger('ice: StreamingClient')

export type RequestId = number
export type Instrument = string // mk this a {base: string, quote: string} to match InputParameters?
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

export enum ConnectionType {
  AUTO = 0,
  STREAMING = 1,
  POLLING = 2,
  LONGPOLLING = 3,
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

  private static getField(data: Field[], fieldId: FieldId): string | null {
    const field = data.find((f) => f.f === fieldId)
    if (field) {
      return field.v
    } else {
      return null
    }
  }

  static sanitize(url: string): string {
    const urlObj = new URL(url)
    if (urlObj.searchParams.has('h')) {
      urlObj.searchParams.set('h', 'redacted')
    }
    return urlObj.toString()
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private connection: JsApi.JSONConnection
  private requestIdToInstrument: Map<RequestId, Instrument> = new Map()

  constructor(public readonly cfg: BaseEndpointTypes['Settings']) {
    super()
    logger.debug('Streaming client constructor called with config: ' + JSON.stringify(cfg))
    this.connection = new JsApi.JSONConnection({
      host: cfg.API_ENDPOINT,
      failoverHosts: [
        cfg.API_ENDPOINT_FAILOVER_1,
        cfg.API_ENDPOINT_FAILOVER_2,
        cfg.API_ENDPOINT_FAILOVER_3,
      ],
      behavior: ConnectionType.POLLING,
      pollingInterval: cfg.POLLING_INTERVAL,
      usergroup: cfg.USER_GROUP,
      password: cfg.NETDANIA_PASSWORD,
    })

    this.connection.addListener(Events.ONINIT, function (info: string) {
      logger.info('ONINIT:' + info + '\n')
    })

    this.connection.addListener(Events.ONCONNECTED, (sessionId: string) => {
      logger.info('ONCONNECTED: ' + sessionId)
    })

    this.connection.addListener(Events.ONRECONNECTED, (sessionId: string) => {
      logger.info('ONRECONNECTED: ' + sessionId)
    })

    // is followed by an automatic reconnection attempt
    this.connection.addListener(Events.ONDISCONNECTED, (msg: string, url: string) => {
      logger.warn('ONDISCONNECTED: ' + msg + ' ' + Utils.sanitize(url) + '\n')
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

      this.connection._tryReconnect = true
      this.connection.reconnect()
      this.flush()
    })
  }

  public disconnect() {
    this.removeAllInstruments()
    this.connection._tryReconnect = false // disable auto-reconnect
    this.connection.disconnect()
  }

  public flush() {
    this.connection.Flush()
  }

  public getActiveInstruments(): Instrument[] {
    const underlyingInstruments: string[] = this.connection
      .GetRequestList()
      .map((r: MonitorPriceRequest) => r.s)
    const own = Array.from(this.requestIdToInstrument.values())
    const setA = new Set(underlyingInstruments)
    const setB = new Set(own)
    if (setA.size !== setB.size || ![...setA].every((v) => setB.has(v))) {
      logger.warn(
        `ICE: instrument drift: underlying = ${underlyingInstruments} (${underlyingInstruments.length}); own = ${own} (${own.length})`,
      )
    }
    return own
  }

  /**
   * Adds instruments to the connection and returning only those effectively added.
   * @param instruments - Array of instrument strings to monitor.
   * @param provider - Underlying provider of prices, defaults to "idc".
   * @returns Array of newly added instruments.
   */
  public addInstruments(instruments: Instrument[], provider = 'idc'): Instrument[] {
    const existingInstruments = new Set(this.requestIdToInstrument.values()) // values is unique only by construction
    const instrumentsToAdd: string[] = Array.from(
      new Set([...instruments].filter((x) => !existingInstruments.has(x))),
    )

    if (instrumentsToAdd.length > 0) {
      const reqs = instrumentsToAdd.map((i) => this.monitorPriceRequest(i, provider))
      this.connection.addRequests(reqs)
      // add result to requestIdToInstrument map
      for (const req of reqs) {
        this.requestIdToInstrument.set(req.i, req.s)
      }
    }
    return instrumentsToAdd
  }

  public removeInstruments(instruments: Instrument[]) {
    const existingInstruments = new Set(this.requestIdToInstrument.values())
    const instrumentsToRemove = instruments.filter((i) => existingInstruments.has(i))
    if (instrumentsToRemove.length > 0) {
      const requestIdsToRemove = Array.from(this.requestIdToInstrument.entries())
        .filter((entry) => instrumentsToRemove.includes(entry[1]))
        .map((entry) => entry[0])
      this.connection.RemoveRequests(requestIdsToRemove)
      requestIdsToRemove.forEach((id) => this.requestIdToInstrument.delete(id))
      this.flush()
    }
  }

  public removeAllInstruments() {
    if (this.requestIdToInstrument.size > 0) {
      const requestIdsToRemove = Array.from(this.requestIdToInstrument.entries()).map(
        (entry) => entry[0],
      )
      this.connection.RemoveRequests(requestIdsToRemove)
      this.flush()
      this.requestIdToInstrument.clear()
    }
  }

  private monitorPriceRequest(instrument: string, provider: string): MonitorPriceRequest {
    return JsApi.Request.getReqObjPrice(instrument, provider, true, null)
  }
}
