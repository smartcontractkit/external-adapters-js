import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { EventEmitter } from 'events'
import { config } from '../../config/'
import { ConnectionType } from './config'
import { window } from './jsApi/jsapi-nodejs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore this should be the single place we do this
const JsApi = window.NetDania.JsApi

const logger = makeLogger('ICE StreamingClient')

// from JsApi.Fields
type FieldId = number

type Field = {
  f: FieldId
  v: string
}

type RequestId = number
type Instrument = string
type Provider = string

export class MonitorPriceResponse {
  type = 2
  id: RequestId // Request ID used to identify the instrument this response is referring to.
  data: Field[]
  modifiedFids: FieldId[]

  constructor(blob: { id: RequestId; data: Field[]; modifiedFids: FieldId[] }) {
    this.id = blob.id
    this.data = blob.data
    this.modifiedFids = blob.modifiedFids
  }

  public get(fieldId: FieldId): string | null {
    const field = this.data.find((f) => f.f === fieldId)
    if (field) {
      return field.v
    } else {
      return null
    }
  }
}

type MonitorPriceRequest = {
  t: 1
  i: RequestId
  m: boolean
  s: Instrument
  p: Provider
}

export type PartialPriceUpdate = {
  id: RequestId
  ticker?: string
  ask?: number
  bid?: number
  mid?: number
  ts: number
  timezone?: string
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
  ONUPDATE = 'OnUpdate', // seems redundant with ONPRICEUPDATE
  ONRAWUPDATE = 'OnRawUpdate', // seems redundant with ONPRICEUPDATE
  ONDISCONNECTED = 'OnDisconnected',
  ONINIT = 'OnInit',
  ONRECONNECTED = 'OnReconnect',
  ONPRICEUPDATE = 'OnPriceUpdate',
  ONCHARTUPDATE = 'OnChartUpdate',
  ONHISTORICALDATA = 'OnHistoricalData',
  ONERROR = 'OnError',
  ONINFO = 'OnInfo', // unnecessary, sends 'price update...' repeatedly
  ONLOOKUP = 'OnLookup',
  ONHISTORICALHEADLINES = 'OnHistHeadlines',
  ONHEADLINEUPDATE = 'OnHeadlineUpdate',
  ONNEWSSTORY = 'OnNewsHist',
  ONNEWSSEARCH = 'OnNewsSearch',
  ONALERTADDED = 'OnAlertAdded',
  ONALERTDELETE = 'OnAlertDelete',
  ONALERTDISCONNECTMONITORUSER = 'OnAlertDisconnectMonitorUser',
  ONALERTDISCONNECTMONITORUSERACTIVITY = 'OnAlertDisconnectMonitorUserActivity',
  ONALERTEDIT = 'OnAlertEdit',
  ONALERTGET = 'OnAlertGet',
  ONALERTGETDELETED = 'OnAlertGetDeleted',
  ONALERTGETTRIGGERED = 'OnAlertGetTriggered',
  ONALERTSGETDELETED = 'OnAlertsGetDeleted',
  ONALERTSGETTRIGGERED = 'OnAlertsGetTriggered',
  ONALERTGETACTIVE = 'OnAlertGetActive',
  ONALERTMONITORUSER = 'OnAlertMonitorUser',
  ONALERTMONITORUSERACTIVITY = 'OnAlertMonitorUserActivity',
  ONALERTGETPUSHDEVICES = 'OnAlertGetPushDevices',
  ONALERTUSERADDED = 'OnAlertUserAdded',
  ONIPLOCATIONRESPONSE = 'OnIPLocationResponse',
  ONWORKSPACEDATA = 'OnWorkspaceData',
  ONHISTORICALCHARTDATA = 'OnHistoricalChartData',
} // from JsApi.Events

export class Utils {
  static readonly BID: FieldId = JsApi.Fields.QUOTE_BID
  static readonly ASK: FieldId = JsApi.Fields.QUOTE_ASK
  static readonly MID_PRICE: FieldId = JsApi.Fields.QUOTE_MID_PRICE
  static readonly TIME_STAMP: FieldId = JsApi.Fields.QUOTE_TIME_STAMP
  static readonly TIME_ZONE: FieldId = JsApi.Fields.QUOTE_TIME_ZONE

  static toPartialPriceUpdate(priceResponse: MonitorPriceResponse): PartialPriceUpdate | null {
    const ts = priceResponse.get(Utils.TIME_STAMP)
    if (ts === null || ts === 'N/A') {
      return null
    }

    const bid = priceResponse.get(Utils.BID)
    const ask = priceResponse.get(Utils.ASK)
    const mid = priceResponse.get(Utils.MID_PRICE)
    const tz = priceResponse.get(Utils.TIME_ZONE)

    return {
      id: priceResponse.id,
      ts: parseInt(ts),
      bid: bid !== null ? parseFloat(bid) : undefined,
      ask: ask !== null ? parseFloat(ask) : undefined,
      mid: mid !== null ? parseFloat(mid) : undefined,
      timezone: tz !== null ? tz : undefined,
    }
  }
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
  // TODO urgh, how to get rid of this?
  connection: JsApi.JSONConnection

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

  onPriceUpdateHandler = (priceUpdate: {
    id: RequestId
    data: Field[]
    modifiedFids: FieldId[]
  }) => {
    logger.debug(`onPriceUpdateHandler ${priceUpdate.id}`)
    logger.trace(JSON.stringify(priceUpdate, null, 0))
    try {
      const partialUpdate: PartialPriceUpdate | null = Utils.toPartialPriceUpdate(
        new MonitorPriceResponse(priceUpdate),
      )
      if (partialUpdate) {
        this.emit('price', partialUpdate)
      } else {
        // TODO should we emit anyway? asked, see email
        logger.warn(`Ignoring update for instrument ${priceUpdate.id}: no timestamp.`)
      }
    } catch (e) {
      logger.error(e, 'Error processing price update: ', JSON.stringify(priceUpdate))
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

  /**
   * Adds instruments to the connection and returns their request IDs, skipping any that are already added.
   * @param instruments - Array of instrument strings to monitor.
   * @param provider - Underlying provider of prices, defaults to "idc".
   * @returns Array of RequestId corresponding to the newly added instruments.
   */
  public async addInstruments(instruments: string[], provider = 'idc'): Promise<RequestId[]> {
    const reqs = instruments.map((i) => this.monitorPriceRequest(i, provider))
    this.connection.addRequests(reqs)
    return reqs.map((req) => {
      return req.i
    })
  }

  public async removeInstruments(instruments: RequestId[]): Promise<void> {
    this.connection.RemoveRequests(instruments)
  }
}
