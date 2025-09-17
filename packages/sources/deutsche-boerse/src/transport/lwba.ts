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
  getIsin,
  isSingleQuoteFrame,
  isSingleTradeFrame,
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
        console.log('Connected to Deutsche Börse LWBA WebSocket')
      },
      error: (errorEvent, _context) => {
        console.log('Deutsche Börse LWBA WebSocket error', JSON.stringify(errorEvent))
      },
      close: (_errorEvent, _context) => {
        console.log('Deutsche Börse LWBA WebSocket closed', JSON.stringify(_errorEvent))
      },
      message(buf) {
        const sm = fromBinary(StreamMessageSchema, buf)

        // Enforce exactly ONE payload
        const msgs = sm.messages ?? []
        if (msgs.length !== 1) {
          throw new Error(
            `Expected exactly one message in StreamMessage.messages, got ${msgs.length}`,
          )
        }

        const anyMsg = msgs[0]

        // Decode MarketData
        const md = fromBinary(MarketDataSchema, anyMsg.value)
        const isin = getIsin(md)
        const dat: any = (md as any)?.Dat ?? ({} as any)

        if (!isin) {
          console.log(md)
          logger.error('Could not parse ISIN', JSON.stringify(md))
          return []
        }

        if (!cache.has(isin)) {
          return []
          // throw new Error('Missing ISIN (Instrmt.AltID/Sym not present)')
        }
        const quote = cache.get(isin)! // exists due to has() guard above

        const providerTime = pickProviderTime(dat)
        if (isSingleTradeFrame(dat)) {
          console.log('Single trade')
          const latestPrice = decimalToNumber(dat.Px)
          cache.addTrade(isin, latestPrice, providerTime)
        } else if (isSingleQuoteFrame(dat)) {
          console.log('Single quote')
          const bidPx = decimalToNumber(dat!.Bid!.Px)
          const askPx = decimalToNumber(dat!.Offer!.Px)
          cache.addQuote(isin, bidPx, askPx, providerTime)
        } else {
          // ignore all other market data variants
          return []
        }

        console.log(isin)
        // console.log(dat)

        return [
          {
            params: { isin },
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
      subscribeMessage: (p: { isin: string }) => {
        if (cache.isEmpty()) {
          cache.activate(p.isin)
          const req = create(RequestSchema, {
            event: 'subscribe',
            requestId: BigInt(Date.now()),
            subscribe: create(SubscribeSchema, {
              stream: [{ stream: 'md-xetraetfetp' }], // startTime/startSeq default to 0n
            }),
          })
          return toBinary(RequestSchema, req)
        } else {
          cache.activate(p.isin)
          return undefined // Explicitly return undefined instead of implicit return
        }
      },

      unsubscribeMessage: (p: { isin: string }) => {
        cache.deactivate(p.isin)
        if (cache.isEmpty()) {
          const req = create(RequestSchema, {
            event: 'unsubscribe',
            requestId: BigInt(Date.now()),
            unsubscribe: create(UnsubscribeSchema, {
              stream: ['md-xetraetfetp'],
            }),
          })
          return toBinary(RequestSchema, req)
        } else {
          return undefined // Explicitly return undefined instead of implicit return
        }
      },
    },
  })
}
export const wsTransport = createLwbaWsTransport()
