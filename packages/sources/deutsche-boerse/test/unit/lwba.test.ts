import { create, fromBinary, toBinary, type MessageInitShape } from '@bufbuild/protobuf'
import { anyPack, type Any } from '@bufbuild/protobuf/wkt'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { RequestSchema, StreamMessageSchema } from '../../src/gen/client_pb'
import {
  Data_MDEntryPrices_MDEntryType,
  Data_PriceTypeValue_PriceType,
  DataSchema,
  DecimalSchema,
  Instrument_SecurityType,
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
const MARKET_EUREX = 'md-microproducts'
const ISIN = 'IE00B53L3W79'
const OTHER = 'US0000000001'

function makeStreamBuffer(md: MarketData | MarketDataInit, subs: string = MARKET): Buffer {
  const mdMsg = create(MarketDataSchema, md as MarketDataInit)
  const anyMsg: Any = anyPack(MarketDataSchema, mdMsg)
  const sm = create(StreamMessageSchema, { subs, messages: [anyMsg] })
  return Buffer.from(toBinary(StreamMessageSchema, sm))
}

function makeStreamBufferTwoMsgs(md1: MarketDataInit, md2: MarketDataInit, subs: string = MARKET) {
  const any1: Any = anyPack(MarketDataSchema, create(MarketDataSchema, md1))
  const any2: Any = anyPack(MarketDataSchema, create(MarketDataSchema, md2))
  const sm = create(StreamMessageSchema, { subs, messages: [any1, any2] })
  return Buffer.from(toBinary(StreamMessageSchema, sm))
}

// Helper to create a spread entry (MID_PRICE with PRICE_SPREAD)
function makeSpreadEntry(spreadValue: bigint, exponent: number, size: bigint) {
  return {
    Typ: Data_MDEntryPrices_MDEntryType.MID_PRICE,
    PxTyp: { Value: Data_PriceTypeValue_PriceType.PRICE_SPREAD },
    Px: dec(spreadValue, exponent),
    Sz: dec(size, 0),
  }
}

// Helper to create a normal rate entry (MID_PRICE with NORMAL_RATE)
function makeNormalRateEntry(priceValue: bigint, exponent: number) {
  return {
    Typ: Data_MDEntryPrices_MDEntryType.MID_PRICE,
    PxTyp: { Value: Data_PriceTypeValue_PriceType.NORMAL_RATE },
    Px: dec(priceValue, exponent),
  }
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

  test('ignores multi-message StreamMessage', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    const buf = makeStreamBufferTwoMsgs(
      { Instrmt: { Sym: ISIN }, Dat: create(DataSchema, { Tm: BigInt(1) } as any) } as any,
      { Instrmt: { Sym: ISIN }, Dat: create(DataSchema, { Tm: BigInt(2) } as any) } as any,
    )
    const out = t.config.handlers.message(buf)
    expect(out).toEqual([])
  })

  test('ignores unsupported market in StreamMessage.subs', () => {
    const t = createLwbaWsTransport(mockExtractData) as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    const md = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, { Tm: BigInt(1) } as any),
    } as any)
    const out = t.config.handlers.message(makeStreamBuffer(md, 'unknown-market'))
    expect(out).toEqual([])
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
    const FRESH_ISIN = 'DE0005810055'
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
    const d = quoteRes[0].response.data
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

    const d = result[0].response.data
    expect(d.bid).toBe(100)
    expect(d.ask).toBe(102)
    expect(d.mid).toBe(101)
  })

  test('protobuf with bid/ask sizes are handled correctly', () => {
    const t = lwbaProtobufWsTransport as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER })

    // Quote with sizes -> should emit immediately as all required data is present
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(BigInt(9500), -2), Sz: dec(BigInt(1500), 0) },
      Offer: { Px: dec(BigInt(9600), -2), Sz: dec(BigInt(1600), 0) },
      Tm: BigInt(7_000_000),
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: OTHER }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))

    expect(quoteRes.length).toBe(1)
    const d = quoteRes[0].response.data
    expect(d.bid).toBe(95)
    expect(d.ask).toBe(96)
    expect(d.mid).toBe(95.5)
    expect(d.bidSize).toBe(1500)
    expect(d.askSize).toBe(1600)
  })

  test('protobuf with zero bid/ask sizes emits successfully', () => {
    const t = lwbaProtobufWsTransport as any
    const TEST_ISIN = 'TEST123456789'
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
    const d = quoteRes[0].response.data
    expect(d.bid).toBe(85)
    expect(d.ask).toBe(86)
    expect(d.mid).toBe(85.5)
    expect(d.bidSize).toBe(0)
    expect(d.askSize).toBe(0)
  })
})

describe('LWBA Spread Parsing', () => {
  test('processes mid price + spread frame correctly', () => {
    const t = lwbaProtobufWsTransport as any
    const SPREAD_ISIN = 'SPREAD0001'
    t.config.builders.subscribeMessage({ market: MARKET, isin: SPREAD_ISIN })

    // Mid price + spread frame
    const spreadDat = create(DataSchema, {
      Pxs: [
        makeSpreadEntry(BigInt(10), -4, BigInt(1000000)), // spread of 0.001, size 1M
        makeNormalRateEntry(BigInt(577), -3), // mid price of 0.577
      ],
      Tm: BigInt(15_000_000),
    } as any)
    const spreadMd = create(MarketDataSchema, {
      Instrmt: { Sym: SPREAD_ISIN },
      Dat: spreadDat,
    } as any)
    const spreadRes = t.config.handlers.message(makeStreamBuffer(spreadMd))

    expect(spreadRes.length).toBe(1)
    const d = spreadRes[0].response.data
    expect(d.mid).toBe(0.577)
    expect(d.bid).toBeCloseTo(0.5765, 4) // mid - halfSpread
    expect(d.ask).toBeCloseTo(0.5775, 4) // mid + halfSpread
    expect(d.bidSize).toBe(1000000)
    expect(d.askSize).toBe(1000000)
  })

  test('selects smallest spread based on sizewhen multiple spreads present', () => {
    const t = lwbaProtobufWsTransport as any
    const MULTI_SPREAD_ISIN = 'SPREAD0002'
    t.config.builders.subscribeMessage({ market: MARKET, isin: MULTI_SPREAD_ISIN })

    // Multiple spread entries with different sizes
    const multiSpreadDat = create(DataSchema, {
      Pxs: [
        makeSpreadEntry(BigInt(20), -4, BigInt(500000)), // spread 0.002, size 500k
        makeSpreadEntry(BigInt(10), -4, BigInt(250000)), // spread 0.001, size 250k (smallest)
        makeSpreadEntry(BigInt(30), -4, BigInt(1000000)), // spread 0.003, size 1M
        makeNormalRateEntry(BigInt(100), -2), // mid price of 1.00
      ],
      Tm: BigInt(16_000_000),
    } as any)
    const multiSpreadMd = create(MarketDataSchema, {
      Instrmt: { Sym: MULTI_SPREAD_ISIN },
      Dat: multiSpreadDat,
    } as any)
    const res = t.config.handlers.message(makeStreamBuffer(multiSpreadMd))

    expect(res.length).toBe(1)
    const d = res[0].response.data
    expect(d.mid).toBe(1.0)
    // Should use the spread with smallest size (250k -> 0.001 spread)
    expect(d.bid).toBeCloseTo(0.9995, 4)
    expect(d.ask).toBeCloseTo(1.0005, 4)
    expect(d.bidSize).toBe(250000)
    expect(d.askSize).toBe(250000)
  })

  test('ignores spread frame without NORMAL_RATE entry', () => {
    const t = lwbaProtobufWsTransport as any
    const NO_NORMAL_ISIN = 'SPREAD0003'
    t.config.builders.subscribeMessage({ market: MARKET, isin: NO_NORMAL_ISIN })

    // Spread without normal rate
    const noNormalRateDat = create(DataSchema, {
      Pxs: [
        makeSpreadEntry(BigInt(10), -4, BigInt(1000000)),
        // Missing NORMAL_RATE entry
      ],
      Tm: BigInt(17_000_000),
    } as any)
    const noNormalMd = create(MarketDataSchema, {
      Instrmt: { Sym: NO_NORMAL_ISIN },
      Dat: noNormalRateDat,
    } as any)
    const res = t.config.handlers.message(makeStreamBuffer(noNormalMd))

    // Should not emit because we can't calculate bid/ask without normal rate
    expect(res).toEqual([])
  })

  test('ignores spread frame without valid spread entries', () => {
    const t = lwbaProtobufWsTransport as any
    const NO_SPREAD_ISIN = 'SPREAD0004'
    t.config.builders.subscribeMessage({ market: MARKET, isin: NO_SPREAD_ISIN })

    // Normal rate without spread
    const noSpreadDat = create(DataSchema, {
      Pxs: [
        makeNormalRateEntry(BigInt(577), -3),
        // Missing PRICE_SPREAD entry
      ],
      Tm: BigInt(18_000_000),
    } as any)
    const noSpreadMd = create(MarketDataSchema, {
      Instrmt: { Sym: NO_SPREAD_ISIN },
      Dat: noSpreadDat,
    } as any)
    const res = t.config.handlers.message(makeStreamBuffer(noSpreadMd))

    // Should not emit because we can't calculate bid/ask without spread
    expect(res).toEqual([])
  })

  test('spread frame with missing Sz on spread entry is ignored', () => {
    const t = lwbaProtobufWsTransport as any
    const NO_SIZE_ISIN = 'SPREAD0005'
    t.config.builders.subscribeMessage({ market: MARKET, isin: NO_SIZE_ISIN })

    // Spread entry without size
    const noSizeDat = create(DataSchema, {
      Pxs: [
        {
          Typ: Data_MDEntryPrices_MDEntryType.MID_PRICE,
          PxTyp: { Value: Data_PriceTypeValue_PriceType.PRICE_SPREAD },
          Px: dec(BigInt(10), -4),
          // Sz is missing
        },
        makeNormalRateEntry(BigInt(577), -3),
      ],
      Tm: BigInt(19_000_000),
    } as any)
    const noSizeMd = create(MarketDataSchema, {
      Instrmt: { Sym: NO_SIZE_ISIN },
      Dat: noSizeDat,
    } as any)
    const res = t.config.handlers.message(makeStreamBuffer(noSizeMd))

    // Should not emit because spread entry is invalid without size
    expect(res).toEqual([])
  })
})

describe('Eurex (md-microproducts) guard', () => {
  test('ignores non-future instruments on Eurex', () => {
    const t = lwbaProtobufWsTransport as any
    const EUREX_ISIN = 'EU000000FNON' // unique to avoid cache interference

    // Activate subscription for Eurex stream
    t.config.builders.subscribeMessage({ market: MARKET_EUREX, isin: EUREX_ISIN })

    // Non-future instrument (no SecTyp or any non-FUT value) → should be ignored
    const mdNonFut = create(MarketDataSchema, {
      Instrmt: { Sym: EUREX_ISIN }, // SecTyp omitted → NOT FUT
      Dat: create(DataSchema, {
        Bid: { Px: dec(10000n, -2), Sz: dec(10n, 0) },
        Offer: { Px: dec(10100n, -2), Sz: dec(11n, 0) },
        Tm: 1_000_000n,
      } as any),
    } as any)

    const out = t.config.handlers.message(makeStreamBuffer(mdNonFut, MARKET_EUREX))
    expect(out).toEqual([]) // ignored because not FUT
  })

  test('processes FUT instruments on Eurex', () => {
    const t = lwbaProtobufWsTransport as any
    const EUREX_FUT_ISIN = 'EU000000FFUT' // unique to avoid cache interference

    // Activate subscription for Eurex stream
    t.config.builders.subscribeMessage({ market: MARKET_EUREX, isin: EUREX_FUT_ISIN })

    // FUT instrument with complete quote → should emit
    const mdFut = create(MarketDataSchema, {
      Instrmt: { Sym: EUREX_FUT_ISIN, SecTyp: Instrument_SecurityType.FUT },
      Dat: create(DataSchema, {
        Bid: { Px: dec(25000n, -2), Sz: dec(5n, 0) }, // 250.00
        Offer: { Px: dec(25150n, -2), Sz: dec(7n, 0) }, // 251.50
        Tm: 2_000_000n,
      } as any),
    } as any)

    const res = t.config.handlers.message(makeStreamBuffer(mdFut, MARKET_EUREX))
    expect(res.length).toBe(1)

    const d = res[0].response.data
    expect(d.bid).toBe(250)
    expect(d.ask).toBe(251.5)
    expect(d.mid).toBe(250.75)
    expect(d.bidSize).toBe(5)
    expect(d.askSize).toBe(7)
  })
})

// Deutsche Boerse sends bid/offer quote frames with a zero price (`Px:{} Sz:{}`, which decodes to
// m=0n e=0 because proto3 omits zero values) right after a trade on md-tradegate; the real quote
// follows ~70ms later. A zero price there means the venue cleared that side of the quote, so the
// adapter must drop the frame instead of publishing bid=0 / a bogus mid.
//
// The hex frames below were captured byte-for-byte from the live stream
// (tools/dbag-price-printer, 2026-10-26).
describe('LWBA zero-priced quote frames', () => {
  const TRADEGATE_ISIN = 'DE0006231004' // unique to avoid cache interference

  // Trade at the offer (18:56:08.588) is followed ~10ms later by this frame:
  //   Dat:{Bid:{Px:{} Sz:{}} Offer:{Px:{} Sz:{}} Tm:1793040968598000000}
  const EMPTY_BOTH_SIDES_HEX =
    '0a0c6d642d74726164656761746510eabaa08881011a8c010a27747970652e676f6f676c65617069732e636f6d2f646261672e6365662e4d61726b6574446174611261120d08e51010a48eefb288c9e8ef6a1a160a0458474154120c444530303036323331303034280722380a0a0a001200220208012a00120c0a001200220208012a0208011a0208025a0208017a0308cb01da0103455552980680a38688ada88af118'

  // 19:34:36.825: bid is empty, offer is a real 50.76 x 1:
  //   Dat:{Bid:{Px:{} Sz:{}} Offer:{Px:{m:5076 e:-2} Sz:{m:1}} Tm:1793043276825000000}
  const EMPTY_BID_REAL_OFFER_HEX =
    '0a0c6d642d74726164656761746510a9e2c98981011a9c010a27747970652e676f6f676c65617069732e636f6d2f646261672e6365662e4d61726b6574446174611271120d08e51010e3b5d8b2c8e9eaef6a1a160a0458474154120c444530303036323331303034280722480a0a0a001200220208012a00121c0a0e08d42710feffffffffffffffff0112020801220208012a0208011a0208025a0208017a0308cb01da01034555529806c0f0b9f0c3eb8af118'

  const GOOD_QUOTE = { bid: 50.49, ask: 50.59, mid: 50.54, bidSize: 100, askSize: 200 }

  const t = lwbaProtobufWsTransport as any

  const goodQuoteBuffer = () =>
    makeStreamBuffer(
      {
        Instrmt: { Sym: TRADEGATE_ISIN },
        Dat: create(DataSchema, {
          Bid: { Px: dec(5049n, -2), Sz: dec(100n, 0) },
          Offer: { Px: dec(5059n, -2), Sz: dec(200n, 0) },
          Tm: 1_793_040_968_000_000_000n,
        } as any),
      } as any,
      MARKET2,
    )

  // A trade frame re-emits whatever quote is cached, so it shows what the cache holds.
  const tradeBuffer = () =>
    makeStreamBuffer(
      {
        Instrmt: { Sym: TRADEGATE_ISIN },
        Dat: create(DataSchema, {
          Px: dec(5059n, -2),
          Sz: dec(2n, 0),
          Tm: 1_793_040_968_100_000_000n,
        } as any),
      } as any,
      MARKET2,
    )

  beforeEach(() => {
    t.config.builders.subscribeMessage({ market: MARKET2, isin: TRADEGATE_ISIN })
  })

  test('baseline: a normal quote is published as-is', () => {
    const out = t.config.handlers.message(goodQuoteBuffer())
    expect(out).toHaveLength(1)
    expect(out[0].response.data).toEqual(GOOD_QUOTE)
  })

  test('both sides zero -> frame is dropped and the cached quote is untouched', () => {
    expect(t.config.handlers.message(goodQuoteBuffer())).toHaveLength(1)

    const out = t.config.handlers.message(Buffer.from(EMPTY_BOTH_SIDES_HEX, 'hex'))

    expect(out).toEqual([])
    const after = t.config.handlers.message(tradeBuffer())
    expect(after[0].response.data).toEqual(GOOD_QUOTE)
  })

  test('zero bid + real offer -> frame is dropped, no bogus mid, cache untouched', () => {
    expect(t.config.handlers.message(goodQuoteBuffer())).toHaveLength(1)

    const out = t.config.handlers.message(Buffer.from(EMPTY_BID_REAL_OFFER_HEX, 'hex'))

    expect(out).toEqual([])
    const after = t.config.handlers.message(tradeBuffer())
    expect(after[0].response.data).toEqual(GOOD_QUOTE)
  })
})
