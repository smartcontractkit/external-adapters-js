import Decimal from 'decimal.js'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { streamNameToAdapterNameOverride } from './util'

const logger = makeLogger('TpIcapPrice')

type WsMessage = {
  msg: 'auth' | 'sub'
  pro?: string
  rec: string // example: FXSPTEURUSDSPT:GBL.BIL.QTE.RTM!IC
  sta: number
  img?: number
  fvs?: {
    CCY1?: string // example: "EUR"
    CCY2?: string // example: "USD"
    ACTIV_DATE?: string // example: "2023-03-06"
    TIMACT?: string // example: "15:00:00"
    BID?: number
    ASK?: number
    MID_PRICE?: number
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

const isNum = (i: number | undefined) => typeof i === 'number'

let providerDataStreamEstablishedUnixMs: number

/*
EAs currently do not receive asset prices during off-market hours. When a heartbeat message is received during these hours,
we update the TTL of cache entries that EA is requested to provide a price during off-market hours.
 */
const updateTTL = async (transport: WebSocketTransport<WsTransportTypes>, ttl: number) => {
  const params = await transport.subscriptionSet.getAll()
  transport.responseCache.writeTTL(transport.name, params, ttl)
}

export const generateTransport = () => {
  const tpTransport = new WebSocketTransport<WsTransportTypes>({
    url: ({ adapterSettings: { WS_API_ENDPOINT } }) => WS_API_ENDPOINT,
    handlers: {
      open: (connection, { adapterSettings: { WS_API_USERNAME, WS_API_PASSWORD } }) => {
        logger.debug('Opening WS connection')

        return new Promise((resolve) => {
          connection.addEventListener('message', (event: MessageEvent) => {
            const { msg, sta } = JSON.parse(event.data.toString())
            if (msg === 'auth' && sta === 1) {
              logger.info('Got logged in response, connection is ready')
              providerDataStreamEstablishedUnixMs = Date.now()
              resolve()
            }
          })
          const options = {
            msg: 'auth',
            user: WS_API_USERNAME,
            pass: WS_API_PASSWORD,
            mode: 'broadcast',
          }
          connection.send(JSON.stringify(options))
        })
      },
      message: (message, context) => {
        logger.debug({ msg: 'Received message from WS', message })

        const providerDataReceivedUnixMs = Date.now()

        if (!('msg' in message) || message.msg === 'auth') return []

        const { fvs, rec, sta } = message

        if (!fvs || !rec || sta !== 1) {
          logger.debug({ msg: 'Missing expected field `fvs` or `rec` from `sub` message', message })
          return []
        }

        // Check for a heartbeat message, refresh the TTLs of all requested entries in the cache
        if (rec.includes('HBHHH')) {
          logger.debug({
            msg: 'Received heartbeat message from WS, updating TTLs of active entries',
            message,
          })
          updateTTL(tpTransport, context.adapterSettings.CACHE_MAX_AGE)
          return []
        }

        const ticker = parseRec(rec)
        if (!ticker) {
          logger.debug({ msg: `Invalid symbol: ${rec}`, message })
          return []
        }

        const { ASK, BID, MID_PRICE } = fvs

        if (!isNum(MID_PRICE) && !(isNum(BID) && isNum(ASK))) {
          const errorMessage = '`sub` message did not include required price fields'
          logger.debug({ errorMessage, message })
          return []
        }

        const result =
          MID_PRICE ||
          new Decimal(ASK as number)
            .add(BID as number)
            .div(2)
            .toNumber()

        const response = {
          result,
          data: {
            result,
          },
          timestamps: {
            providerDataReceivedUnixMs,
            providerDataStreamEstablishedUnixMs,
            providerIndicatedTimeUnixMs: undefined,
          },
        }

        // Cache both the base and the full ticker string. The full ticker is to
        // accomodate cases where there are multiple instruments for a single base
        // (e.g. forwards like CEFWDXAUUSDSPT06M:LDN.BIL.QTE.RTM!TP, CEFWDXAUUSDSPT02Y:LDN.BIL.QTE.RTM!TP, CEFWDXAUUSDSPT03M:LDN.BIL.QTE.RTM!TP, etc).
        // It is expected that for such cases, the exact ticker will be provided as
        // an override.
        // e.g. request body = {"data":{"endpoint":"forex","from":"CHF","to":"USD","overrides":{"tp":{"CHF":"FXSPTUSDAEDSPT:GBL.BIL.QTE.RTM!TP"}}}}
        return [
          {
            params: {
              base: ticker.base,
              quote: ticker.quote,
              streamName: ticker.stream,
              sourceName: ticker.source,
              adapterNameOverride: streamNameToAdapterNameOverride(ticker.stream),
            },
            response,
          },
          {
            params: {
              base: rec,
              quote: ticker.quote,
              streamName: ticker.stream,
              sourceName: ticker.source,
              adapterNameOverride: streamNameToAdapterNameOverride(ticker.stream),
            },
            response,
          },
        ] as unknown as ProviderResult<WsTransportTypes>[]
      },
    },
  })
  return tpTransport
}

// mapping OTRWTS to WTIUSD specifically for caching with quote = USD
const marketBaseQuoteOverrides: Record<string, string> = {
  CEOILOTRWTS: 'CEOILWTIUSD',
}

type Ticker = {
  market: string
  base: string
  quote: string
  source: string
  stream: string
}

/*
For example, if rec = 'FXSPTCHFSEKSPT:GBL.BIL.QTE.RTM!IC', then the parsed output is
{
  market: 'FXSPT',
  base: 'CHF',
  quote: 'SEK',
  source: 'GBL',
  stream: 'IC'
}
*/
export const parseRec = (rec: string): Ticker | null => {
  const [symbol, rec1] = rec.split(':')
  if (!rec1) {
    return null
  }

  const [sources, stream] = rec1.split('!')
  if (!stream) {
    return null
  }

  let marketBaseQuote = symbol.slice(0, 11)
  if (marketBaseQuote in marketBaseQuoteOverrides) {
    marketBaseQuote = marketBaseQuoteOverrides[marketBaseQuote]
  }

  return {
    market: marketBaseQuote.slice(0, 5),
    base: marketBaseQuote.slice(5, 8),
    quote: marketBaseQuote.slice(8, 11),
    source: sources.split('.')[0],
    stream,
  }
}
