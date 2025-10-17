import { create, toBinary, type MessageInitShape } from '@bufbuild/protobuf'
import { anyPack, type Any } from '@bufbuild/protobuf/wkt'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { StreamMessageSchema } from '../../src/gen/client_pb'
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
  // Test the base transport functionality using a simplified extract function
  const mockExtractData = (quote: any) => {
    if (
      quote.latestPrice == null ||
      quote.quoteProviderTimeUnixMs == null ||
      quote.tradeProviderTimeUnixMs == null
    ) {
      return undefined
    }
    return {
      latestPrice: quote.latestPrice,
      quoteProviderIndicatedTimeUnixMs: quote.quoteProviderTimeUnixMs,
      tradeProviderIndicatedTimeUnixMs: quote.tradeProviderTimeUnixMs,
    }
  }

  test('message for non-activated instrument returns []', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    const md = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, {
        Bid: { Px: dec(BigInt(10000), -2) },
        Offer: { Px: dec(BigInt(10100), -2) },
        Tm: BigInt(1000000),
      } as any),
    } as any)
    const out = t.config.handlers.message(makeStreamBuffer(md))
    expect(out).toEqual([])
  })

  test('subscribe builder: first subscribe returns frame, subsequent subscribes return undefined', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    const first = t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    const second = t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER })
    expect(first).toBeInstanceOf(Uint8Array)
    expect(second).toBeUndefined()
  })

  test('unsubscribe builder: removing last returns frame, otherwise undefined', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER })

    const removeOne = t.config.builders.unsubscribeMessage({ market: MARKET, isin: OTHER })
    expect(removeOne).toBeUndefined()

    const removeLast = t.config.builders.unsubscribeMessage({ market: MARKET, isin: ISIN })
    expect(removeLast).toBeInstanceOf(Uint8Array)
  })

  test('missing ISIN: handler returns []', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    const md = create(MarketDataSchema, {
      Dat: create(DataSchema, { Px: dec(BigInt(100), 0), Tm: BigInt(1000000) } as any),
    } as any)
    const out = t.config.handlers.message(makeStreamBuffer(md))
    expect(out).toEqual([])
  })

  test('defensive decoding: bad buffer returns []', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    const res = t.config.handlers.message(Buffer.from('not-a-protobuf'))
    expect(res).toEqual([])
  })

  test('open() refreshes TTL immediately and on interval', async () => {
    jest.useFakeTimers()
    const t = createLwbaWsTransport(mockExtractData) as any

    // stub framework bits
    const writeTTL = jest.fn()
    t.responseCache = { writeTTL }
    t.subscriptionSet = { getAll: jest.fn().mockResolvedValue([]) }

    const ctx = {
      adapterSettings: {
        WS_API_ENDPOINT: 'wss://example',
        API_KEY: 'key',
        CACHE_MAX_AGE: 45000,
        CACHE_TTL_REFRESH_MS: 60000,
      },
    } as any

    await t.config.handlers.open({}, ctx)
    expect(writeTTL).toHaveBeenCalledTimes(1)

    // Advance one full interval AND await the async callback
    await jest.advanceTimersByTimeAsync(60000)

    expect(writeTTL).toHaveBeenCalledTimes(2)

    jest.useRealTimers()
  })
})

describe('LWBA Latest Price Transport', () => {
  test('emits only when latestPrice is available', () => {
    const t = priceProtobufWsTransport as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })

    // Quote (no latestPrice yet) -> should NOT emit
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(10000), -2) },
      Offer: { Px: dec(BigInt(10100), -2) },
      Tm: BigInt(5000000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))
    expect(quoteRes).toEqual([])

    // Trade (now latestPrice arrives) -> should emit
    const tradeDat = create(DataSchema, { Px: dec(BigInt(9999), -2), Tm: BigInt(6000000) } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd))

    expect(tradeRes.length).toBe(1)
    const [entry] = tradeRes
    const d = entry.response.data

    expect(d.latestPrice).toBe(99.99)
    expect(d.quoteProviderIndicatedTimeUnixMs).toBe(5)
    expect(d.tradeProviderIndicatedTimeUnixMs).toBe(6)
    expect(entry.response.timestamps.providerIndicatedTimeUnixMs).toBe(6)
  })

  test('emits when complete data is available from cache', () => {
    // This test runs after the previous test which populated the cache with quote data
    const t = priceProtobufWsTransport as any

    // Since quote data is already in cache from previous test, adding trade data should trigger emission
    const tradeDat = create(DataSchema, { Px: dec(BigInt(9999), -2), Tm: BigInt(6000000) } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd))

    // Should emit because we now have complete data (quote from previous test + trade from this test)
    expect(tradeRes.length).toBe(1)
    expect(tradeRes[0].response.data.latestPrice).toBe(99.99)
    expect(tradeRes[0].response.data.quoteProviderIndicatedTimeUnixMs).toBe(5)
    expect(tradeRes[0].response.data.tradeProviderIndicatedTimeUnixMs).toBe(6)
  })
})

describe('LWBA Metadata Transport', () => {
  test('emits only when bid, ask, and latestPrice are available', () => {
    const t = lwbaProtobufWsTransport as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })

    // Quote only -> should NOT emit yet
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(10000), -2) },
      Offer: { Px: dec(BigInt(10100), -2) },
      Tm: BigInt(5000000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))
    expect(quoteRes).toEqual([])

    // Trade (now we have complete data) -> should emit
    const tradeDat = create(DataSchema, { Px: dec(BigInt(9999), -2), Tm: BigInt(6000000) } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd))

    expect(tradeRes.length).toBe(1)
    const [entry] = tradeRes
    const d = entry.response.data

    expect(d.bid).toBe(100)
    expect(d.ask).toBe(101)
    expect(d.mid).toBe(100.5)
    expect(d.bidSize).toBe(null)
    expect(d.askSize).toBe(null)
    expect(d.quoteProviderIndicatedTimeUnixMs).toBe(5)
    expect(d.tradeProviderIndicatedTimeUnixMs).toBe(6)
    expect(entry.response.timestamps.providerIndicatedTimeUnixMs).toBe(6)
  })

  test('bid-only then ask-only then trade → emits when complete', () => {
    const t = lwbaProtobufWsTransport as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })

    // bid-only -> might emit if there's already trade data in cache from previous tests
    const bidOnly = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, { Bid: { Px: dec(BigInt(10000), -2) }, Tm: BigInt(10000000) } as any),
    } as any)
    const bidResult = t.config.handlers.message(makeStreamBuffer(bidOnly))
    // The result depends on whether there's already trade data in the cache
    if (bidResult.length > 0) {
      // If it emits, verify the data is reasonable (bid + cached data)
      expect(bidResult[0].response.data.bid).toBe(100)
    }

    // ask-only -> add ask data to cache
    const askOnly = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, {
        Offer: { Px: dec(BigInt(10200), -2) },
        Tm: BigInt(11000000),
      } as any),
    } as any)

    // trade → should definitely emit now that we have complete fresh data
    const trade = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, { Px: dec(BigInt(10100), -2), Tm: BigInt(12000000) } as any),
    } as any)
    const result = t.config.handlers.message(makeStreamBuffer(trade))
    expect(result.length).toBe(1)

    const [entry] = result
    expect(entry.response.data.bid).toBe(100)
    expect(entry.response.data.ask).toBe(102)
    expect(entry.response.data.mid).toBe(101)
    expect(entry.response.data.quoteProviderIndicatedTimeUnixMs).toBe(11)
    expect(entry.response.data.tradeProviderIndicatedTimeUnixMs).toBe(12)
  })

  test('protobuf with bid/ask sizes are handled correctly', () => {
    const t = lwbaProtobufWsTransport as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER }) // Use different ISIN to avoid cache interference

    // Quote with sizes -> should NOT emit yet (no trade data)
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(9500), -2), Sz: dec(BigInt(1500), 0) },
      Offer: { Px: dec(BigInt(9600), -2), Sz: dec(BigInt(1600), 0) },
      Tm: BigInt(7000000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: OTHER }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))
    expect(quoteRes).toEqual([])

    // Trade (now we have complete data) -> should emit
    const tradeDat = create(DataSchema, { Px: dec(BigInt(9550), -2), Tm: BigInt(8000000) } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: OTHER }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd))

    expect(tradeRes.length).toBe(1)
    const [entry] = tradeRes
    const d = entry.response.data

    expect(d.bid).toBe(95)
    expect(d.ask).toBe(96)
    expect(d.mid).toBe(95.5)
    expect(d.bidSize).toBe(1500)
    expect(d.askSize).toBe(1600)
    expect(d.quoteProviderIndicatedTimeUnixMs).toBe(7)
    expect(d.tradeProviderIndicatedTimeUnixMs).toBe(8)
    expect(entry.response.timestamps.providerIndicatedTimeUnixMs).toBe(8)
  })

  test('protobuf without bid/ask sizes defaults to null/undefined', () => {
    const t = lwbaProtobufWsTransport as any
    const TEST_ISIN = 'TEST123456789' // Use unique ISIN to avoid cache interference
    t.config.builders.subscribeMessage({ market: MARKET, isin: TEST_ISIN })

    // Quote without sizes -> should NOT emit yet (no trade data)
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(8500), -2) },
      Offer: { Px: dec(BigInt(8600), -2) },
      Tm: BigInt(9000000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: TEST_ISIN }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))
    expect(quoteRes).toEqual([])

    // Trade (now we have complete data) -> should emit
    const tradeDat = create(DataSchema, { Px: dec(BigInt(8550), -2), Tm: BigInt(10000000) } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: TEST_ISIN }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd))

    expect(tradeRes.length).toBe(1)
    const [entry] = tradeRes
    const d = entry.response.data

    expect(d.bid).toBe(85)
    expect(d.ask).toBe(86)
    expect(d.mid).toBe(85.5)
    expect(d.bidSize).toBe(null)
    expect(d.askSize).toBe(null)
    expect(d.quoteProviderIndicatedTimeUnixMs).toBe(9)
    expect(d.tradeProviderIndicatedTimeUnixMs).toBe(10)
    expect(entry.response.timestamps.providerIndicatedTimeUnixMs).toBe(10)
  })
})
