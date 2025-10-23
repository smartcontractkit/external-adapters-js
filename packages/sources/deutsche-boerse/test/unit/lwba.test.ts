import { create, fromBinary, toBinary, type MessageInitShape } from '@bufbuild/protobuf'
import { anyPack, type Any } from '@bufbuild/protobuf/wkt'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { RequestSchema, StreamMessageSchema } from '../../src/gen/client_pb'
import {
  DataSchema,
  DecimalSchema,
  MarketDataSchema,
  type Decimal,
  type MarketData,
} from '../../src/gen/md_cef_pb'
import { createLwbaWsTransport, lwbaProtobufWsTransport } from '../../src/transport/lwba'
import { priceProtobufWsTransport } from '../../src/transport/price'

LoggerFactoryProvider.set()

const dec = (m: bigint, e: number): Decimal => create(DecimalSchema, { m, e })
type MarketDataInit = MessageInitShape<typeof MarketDataSchema>
const MARKET = 'md-xetraetfetp' as const
const MARKET2 = 'md-tradegate' as const
const ISIN = 'IE00B53L3W79'
const OTHER = 'US0000000001'

function makeStreamBuffer(md: MarketData | MarketDataInit): Buffer {
  const mdMsg = create(MarketDataSchema, md as MarketDataInit)
  const anyMsg: Any = anyPack(MarketDataSchema, mdMsg)
  const sm = create(StreamMessageSchema, {
    subs: MARKET,
    messages: [anyMsg],
  })
  return Buffer.from(toBinary(StreamMessageSchema, sm))
}

describe('LWBA websocket transport base functionality', () => {
  // Match transport signature: accept providerTime, ignore it for this base test
  const mockExtractData = (quote: any) => {
    if (quote.latestPrice == null) {
      return undefined
    }
    return {
      latestPrice: quote.latestPrice,
    }
  }

  test('message for non-activated instrument returns []', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    const md = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, {
        Bid: { Px: dec(BigInt(10000), -2) },
        Offer: { Px: dec(BigInt(10100), -2) },
        Tm: BigInt(1_000_000),
      } as any),
    } as any)
    const out = t.config.handlers.message(makeStreamBuffer(md))
    expect(out).toEqual([])
  })

  test('subscribe builder: first subscribe returns frame, subsequent subscribes (same market) return undefined', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    const first = t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    const second = t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER })

    expect(first).toBeInstanceOf(Uint8Array)
    expect(second).toBeUndefined()

    // Verify first frame includes only the one active market
    const req = fromBinary(RequestSchema, first as Uint8Array)
    const streams = req.subscribe?.stream?.map((s) => s.stream) ?? []
    expect(streams).toEqual([MARKET])
  })

  test('subscribe builder: activating a NEW market emits a frame including ALL active markets', () => {
    const t = createLwbaWsTransport(mockExtractData) as any

    // First market
    const first = t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    expect(first).toBeInstanceOf(Uint8Array)
    const req1 = fromBinary(RequestSchema, first as Uint8Array)
    expect(req1.subscribe?.stream?.map((s) => s.stream)).toEqual([MARKET])

    // Second market -> frame should include both markets
    const second = t.config.builders.subscribeMessage({ market: MARKET2, isin: OTHER })
    expect(second).toBeInstanceOf(Uint8Array)
    const req2 = fromBinary(RequestSchema, second as Uint8Array)
    const streams2 = (req2.subscribe?.stream?.map((s) => s.stream) ?? []).sort()
    expect(streams2).toEqual([MARKET, MARKET2].sort())

    // Adding another instrument to an already-subscribed market -> no frame
    const third = t.config.builders.subscribeMessage({ market: MARKET, isin: 'DE0000000002' })
    expect(third).toBeUndefined()
  })

  test('unsubscribe builder: removing last returns frame, otherwise undefined', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER })

    const removeOne = t.config.builders.unsubscribeMessage({ market: MARKET, isin: OTHER })
    expect(removeOne).toBeUndefined()

    const removeLast = t.config.builders.unsubscribeMessage({ market: MARKET, isin: ISIN })
    expect(removeLast).toBeInstanceOf(Uint8Array)

    // Decode unsubscribe frame to ensure it targets the correct market
    const req = fromBinary(RequestSchema, removeLast as Uint8Array)
    const unsubStreams = req.unsubscribe?.stream ?? []
    expect(unsubStreams).toEqual([MARKET])
  })

  test('missing ISIN: handler returns []', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    const md = create(MarketDataSchema, {
      Dat: create(DataSchema, { Px: dec(BigInt(100), 0), Tm: BigInt(1_000_000) } as any),
    } as any)
    const out = t.config.handlers.message(makeStreamBuffer(md))
    expect(out).toEqual([])
  })

  test('defensive decoding: bad buffer returns []', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    const res = t.config.handlers.message(Buffer.from('not-a-protobuf'))
    expect(res).toEqual([])
  })
})

describe('LWBA Latest Price Transport', () => {
  test('emits only when latestPrice is available', () => {
    const t = priceProtobufWsTransport as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })

    // Quote (no latestPrice yet) -> should NOT emit
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(10000), -2), Sz: dec(BigInt(2000), 0) },
      Offer: { Px: dec(BigInt(10100), -2), Sz: dec(BigInt(1000), 0) },
      Tm: BigInt(5_000_000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))
    expect(quoteRes).toEqual([])

    // Trade (now latestPrice arrives) -> should emit
    const tradeDat = create(DataSchema, { Px: dec(BigInt(9999), -2), Tm: BigInt(6_000_000) } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd))

    expect(tradeRes.length).toBe(1)
    const [entry] = tradeRes
    expect(entry.response.data.latestPrice).toBe(99.99)
  })

  test('emits when complete data is available from cache', () => {
    // This test runs after the previous test which populated the cache with quote data
    const t = priceProtobufWsTransport as any

    // Since quote data is already in cache from previous test, adding trade data should trigger emission
    const tradeDat = create(DataSchema, { Px: dec(BigInt(9999), -2), Tm: BigInt(6_000_000) } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd))

    expect(tradeRes.length).toBe(1)
    expect(tradeRes[0].response.data.latestPrice).toBe(99.99)
  })
})

describe('LWBA Metadata Transport', () => {
  test('emits when complete bid/ask data with sizes is available', () => {
    const t = lwbaProtobufWsTransport as any
    const FRESH_ISIN = 'DE0005810055' // Use unique ISIN to avoid cache interference
    t.config.builders.subscribeMessage({ market: MARKET, isin: FRESH_ISIN })

    // Complete quote with bid, ask, and sizes -> should emit
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(10000), -2), Sz: dec(BigInt(2000), 0) },
      Offer: { Px: dec(BigInt(10100), -2), Sz: dec(BigInt(1000), 0) },
      Tm: BigInt(5_000_000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: FRESH_ISIN }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))

    expect(quoteRes.length).toBe(1)
    const [entry] = quoteRes
    const d = entry.response.data

    expect(d.bid).toBe(100)
    expect(d.ask).toBe(101)
    expect(d.mid).toBe(100.5)
    expect(d.bidSize).toBe(2000)
    expect(d.askSize).toBe(1000)
  })

  test('bid-only then ask-only then trade → emits when complete', () => {
    const t = lwbaProtobufWsTransport as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })

    // bid-only
    const bidOnly = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, {
        Bid: { Px: dec(BigInt(10000), -2), Sz: dec(BigInt(2000), 0) },
        Tm: BigInt(10_000_000),
      } as any),
    } as any)
    const bidResult = t.config.handlers.message(makeStreamBuffer(bidOnly))
    if (bidResult.length > 0) {
      expect(bidResult[0].response.data.bid).toBe(100)
    }

    // ask-only -> add ask data to cache
    const askOnly = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, {
        Offer: { Px: dec(BigInt(10200), -2), Sz: dec(BigInt(750), 0) },
        Tm: BigInt(11_000_000),
      } as any),
    } as any)
    t.config.handlers.message(makeStreamBuffer(askOnly))

    // trade → should definitely emit now that we have complete data
    const trade = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, {
        Px: dec(BigInt(10100), -2),
        Sz: dec(BigInt(500), 0),
        Tm: BigInt(12_000_000),
      } as any),
    } as any)
    const result = t.config.handlers.message(makeStreamBuffer(trade))
    expect(result.length).toBe(1)

    const [entry] = result
    expect(entry.response.data.bid).toBe(100)
    expect(entry.response.data.ask).toBe(102)
    expect(entry.response.data.mid).toBe(101)
  })

  test('protobuf with bid/ask sizes are handled correctly', () => {
    const t = lwbaProtobufWsTransport as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER }) // Use different ISIN to avoid cache interference

    // Quote with sizes -> should emit immediately as all required data is present
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(9500), -2), Sz: dec(BigInt(1500), 0) },
      Offer: { Px: dec(BigInt(9600), -2), Sz: dec(BigInt(1600), 0) },
      Tm: BigInt(7_000_000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: OTHER }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))

    expect(quoteRes.length).toBe(1)
    const [entry] = quoteRes
    const d = entry.response.data

    expect(d.bid).toBe(95)
    expect(d.ask).toBe(96)
    expect(d.mid).toBe(95.5)
    expect(d.bidSize).toBe(1500)
    expect(d.askSize).toBe(1600)
  })

  test('protobuf with zero bid/ask sizes emits successfully', () => {
    const t = lwbaProtobufWsTransport as any
    const TEST_ISIN = 'TEST123456789' // Use unique ISIN to avoid cache interference
    t.config.builders.subscribeMessage({ market: MARKET, isin: TEST_ISIN })

    // Quote with zero sizes -> should emit
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(8500), -2), Sz: dec(BigInt(0), 0) },
      Offer: { Px: dec(BigInt(8600), -2), Sz: dec(BigInt(0), 0) },
      Tm: BigInt(9_000_000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: TEST_ISIN }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))

    expect(quoteRes.length).toBe(1)
    const [entry] = quoteRes
    const d = entry.response.data

    expect(d.bid).toBe(85)
    expect(d.ask).toBe(86)
    expect(d.mid).toBe(85.5)
    expect(d.bidSize).toBe(0)
    expect(d.askSize).toBe(0)
  })
})
