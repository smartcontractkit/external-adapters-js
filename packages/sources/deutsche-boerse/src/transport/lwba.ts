import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { BaseEndpointTypes } from '../endpoint/lwba'
import {
  RequestSchema,
  StreamMessageSchema,
  SubscribeSchema,
  UnsubscribeSchema,
} from '../gen/client_pb'

import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { MarketDataSchema } from '../gen/md_cef_pb'
import { InstrumentQuoteCache } from './instrument-quote-cache'
import {
  decimalToNumber,
  isSingleQuoteFrame,
  isSingleTradeFrame,
  parseIsin,
  pickProviderTime,
} from './proto-utils'
import { ProtobufWsTransport } from './protobuf-wstransport'

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Buffer
  }
}

const logger = makeLogger('DeutscheBoerseTransport')

export function createLwbaWsTransport() {
  const cache = new InstrumentQuoteCache()
  return new ProtobufWsTransport<WsTransportTypes>({
    url: (context) => `${context.adapterSettings.WS_API_ENDPOINT}/stream?format=proto`,

    options: async (context) => ({
      headers: {
        'X-API-Key': context.adapterSettings.API_KEY,
      },
      followRedirects: true,
    }),

    handlers: {
      open: (_connetion) => {
        logger.info('LWBA websocket connection established')
      },
      error: (errorEvent, _context) => {
        logger.error({ errorEvent }, 'LWBA websocket error')
      },
      close: (closeEvent, _context) => {
        const code = (closeEvent as any)?.code
        const reason = (closeEvent as any)?.reason
        const wasClean = (closeEvent as any)?.wasClean
        logger.info({ code, reason, wasClean }, 'LWBA websocket closed')
      },
      message(buf) {
        logger.debug(
          {
            payloadType: Buffer.isBuffer(buf) ? 'buffer' : typeof buf,
            byteLength: Buffer.isBuffer(buf) ? buf.byteLength : undefined,
          },
          'LWBA websocket message received',
        )
        let sm: ReturnType<typeof fromBinary<typeof StreamMessageSchema>>
        try {
          sm = fromBinary(StreamMessageSchema, buf)
        } catch (err) {
          logger.error({ err }, 'Failed to decode Client.StreamMessage from binary')
          return []
        }

        // Enforce exactly ONE payload
        const msgs = sm.messages ?? []
        if (msgs.length !== 1) {
          logger.warn({ count: msgs.length }, 'Expected exactly one message in StreamMessage')
          return []
        }
        const market = 'md-xetraetfetp' // currently only one supported market/stream
        const anyMsg = msgs[0]
        // Decode MarketData
        let md: ReturnType<typeof fromBinary<typeof MarketDataSchema>>
        try {
          md = fromBinary(MarketDataSchema, anyMsg.value)
        } catch (err) {
          logger.error(
            { err, typeUrl: anyMsg.typeUrl },
            'Failed to decode MarketData from Client.StreamMessage',
          )
          return []
        }

        const isin = parseIsin(md)
        const dat: any = (md as any)?.Dat ?? ({} as any)

        if (!isin) {
          logger.warn({ md }, 'Could not parse ISIN from MarketData.Instrmt.Sym')
          return []
        }

        if (!cache.has(isin)) {
          logger.debug({ isin }, 'Ignoring message for inactive instrument (not in cache)')
          return []
        }
        const quote = cache.get(isin)! // exists due to has() guard above

        const providerTime = pickProviderTime(dat)
        if (isSingleTradeFrame(dat)) {
          const latestPrice = decimalToNumber(dat.Px)
          cache.addTrade(isin, latestPrice, providerTime)
          logger.debug(
            { isin, latestPrice, providerTimeUnixMs: providerTime },
            'Processed single trade frame',
          )
        } else if (isSingleQuoteFrame(dat)) {
          const bidPx = decimalToNumber(dat!.Bid!.Px)
          const askPx = decimalToNumber(dat!.Offer!.Px)
          cache.addQuote(isin, bidPx, askPx, providerTime)
          logger.debug(
            {
              isin,
              bid: bidPx,
              ask: askPx,
              mid: (bidPx + askPx) / 2,
              providerTimeUnixMs: providerTime,
            },
            'Processed single quote frame',
          )
        } else {
          // ignore all other market data variants
          logger.debug(
            { isin, keys: Object.keys(dat ?? {}) },
            'Ignoring unsupported market data frame',
          )
          return []
        }

        return [
          {
            params: { isin, market },
            response: {
              result: null,
              data: {
                mid: quote.mid ?? null,
                bid: quote.bid ?? null,
                ask: quote.ask ?? null,
                latestPrice: quote.latestPrice ?? null,
                quoteProviderIndicatedTimeUnixMs: quote?.quoteProviderTimeUnixMs ?? null,
                tradeProviderIndicatedTimeUnixMs: quote?.tradeProviderTimeUnixMs ?? null,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: providerTime,
              },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (p: { market: string; isin: string }) => {
        if (cache.isEmpty()) {
          cache.activate(p.isin)
          const req = create(RequestSchema, {
            event: 'subscribe',
            requestId: BigInt(Date.now()),
            subscribe: create(SubscribeSchema, {
              stream: [{ stream: p.market }], // startTime/startSeq default to 0n
            }),
          })
          logger.info(
            { isin: p.isin, market: p.market },
            'Building initial subscribe request (first instrument activates stream)',
          )
          return toBinary(RequestSchema, req)
        } else {
          cache.activate(p.isin)
          logger.debug(
            { isin: p.isin, market: p.market },
            'Instrument activated; stream already subscribed, no outbound subscribe message sent',
          )
          return undefined
        }
      },

      unsubscribeMessage: (p: { market: string; isin: string }) => {
        cache.deactivate(p.isin)
        if (cache.isEmpty()) {
          const req = create(RequestSchema, {
            event: 'unsubscribe',
            requestId: BigInt(Date.now()),
            unsubscribe: create(UnsubscribeSchema, {
              stream: [p.market],
            }),
          })
          logger.info(
            { isin: p.isin, market: p.market },
            'All instruments deactivated; building unsubscribe request',
          )
          return toBinary(RequestSchema, req)
        } else {
          logger.debug(
            { isin: p.isin, market: p.market },
            'Instrument deactivated; other instruments still active, no outbound unsubscribe sent',
          )
          return undefined
        }
      },
    },
  })
}
export const wsTransport = createLwbaWsTransport()
