import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { BaseEndpointTypes } from '../endpoint/lwba'
import {
  RequestSchema,
  StreamMessageSchema,
  SubscribeSchema,
  UnsubscribeSchema,
} from '../gen/client_pb'

import { MarketDataSchema } from '../gen/md_cef_pb'
import { ProtobufWsTransport } from './ProtobufWsTransport'

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Buffer
  }
}

export type Book = {
  bid?: number
  ask?: number
  mid?: number
  latestPrice?: number
  providerTime?: number
}

// TODO: Move to class with pruning logic
const books = new Map<string, Book>() // key = ISIN

export const wsTransport = new ProtobufWsTransport<WsTransportTypes>({
  url: (context) => `${context.adapterSettings.WS_API_ENDPOINT}/stream?format=proto`,

  options: async (context) => ({
    headers: {
      'X-API-Key': context.adapterSettings.API_KEY,
    },
    followRedirects: true,
  }),

  handlers: {
    open: (_connetion) => {},
    close: (_errorEvent, _context) => {},
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
      const isin = getIsinOrSym(md)
      const dat: any = (md as any)?.Dat ?? ({} as any)

      if (!isin || !books.has(isin)) {
        return []
        // throw new Error('Missing ISIN (Instrmt.AltID/Sym not present)')
      }
      const book = books.get(isin) ?? {}
      let changed = false

      if (isSingleTradeFrame(dat)) {
        const last = decimalToNumber(dat.Px)
        if (last !== undefined) {
          book.latestPrice = last
          changed = true
        }
      } else if (isSingleQuoteFrame(dat)) {
        const bidPx = decimalToNumber(dat?.Bid?.Px)
        const askPx = decimalToNumber(dat?.Offer?.Px)

        if (bidPx !== undefined) {
          book.bid = bidPx
          changed = true
        }
        if (askPx !== undefined) {
          book.ask = askPx
          changed = true
        }
        if (book.bid !== undefined && book.ask !== undefined) {
          book.mid = (book.bid + book.ask) / 2
        }
      } else {
        // ignore all other market data variants (depth, ladders, MBO/MBP, etc.)
        return []
      }

      console.log(isin)
      console.log(dat)

      const providerTime = pickProviderTime(dat)
      if (providerTime !== undefined) book.providerTime = providerTime

      if (changed) {
        books.set(isin, book)
      }

      return [
        {
          params: { isin },
          response: {
            result: null,
            data: {
              mid: book.mid ?? null,
              bid: book.bid ?? null,
              ask: book.ask ?? null,
              latestPrice: book.latestPrice ?? null,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: book.providerTime ?? undefined,
            },
          },
        },
      ]
    },
  },
  builders: {
    subscribeMessage: (p: { isin: string }) => {
      books.set(p.isin, {})
      const req = create(RequestSchema, {
        event: 'subscribe',
        requestId: BigInt(Date.now()),
        subscribe: create(SubscribeSchema, {
          stream: [{ stream: 'md-xetraetfetp', startTime: BigInt(1756802686000000000) }], // startTime/startSeq default to 0n
        }),
      })
      return toBinary(RequestSchema, req)
    },

    unsubscribeMessage: (_p: { isin: string }) => {
      const req = create(RequestSchema, {
        event: 'unsubscribe',
        requestId: BigInt(Date.now()),
        unsubscribe: create(UnsubscribeSchema, {
          stream: ['md-xetraetfetp'],
        }),
      })
      return toBinary(RequestSchema, req)
    },
  },
})

// ---- helpers ----
function decimalToNumber(decimal?: { m?: bigint; e?: number }): number | undefined {
  if (!decimal || decimal.m == null || decimal.e == null) return
  const exponent = Number(decimal.e)
  const mantissa = BigInt(decimal.m)
  const n = Number(mantissa) * Math.pow(10, exponent)
  return Number.isFinite(n) ? n : undefined
}

function normalizeToMs(t?: bigint): number | undefined {
  if (t == null) return
  return Math.floor(Number(t) / 1e6) // ns -> ms
}
function getIsinOrSym(md: any): string | undefined {
  const instr = md?.Instrmt ?? md?.instrmt
  if (!instr) return
  const sym = instr?.Sym ?? instr?.sym
  return (typeof sym === 'string' && sym) || undefined
}
function pickProviderTime(dat: any): number | undefined {
  return normalizeToMs(dat?.Tm)
}

function isDecimalPrice(x: any): boolean {
  const hasMantissa = x != null && (typeof x.m === 'number' || typeof x.m === 'bigint')
  const hasExponent = typeof x?.e === 'number' || typeof x?.e === 'bigint'
  return hasMantissa && hasExponent
}

// true if this frame is exactly a "single trade price"
function isSingleTradeFrame(dat: any): boolean {
  return isDecimalPrice(dat?.Px)
}

// true if this frame carries only a single best bid/offer (not ladders/levels)
function isSingleQuoteFrame(dat: any): boolean {
  return isDecimalPrice(dat?.Bid?.Px) && isDecimalPrice(dat?.Offer?.Px)
}
