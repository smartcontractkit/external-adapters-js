// packages/sources/deutsche-boerse/test/unit/lwba.ws.transport.test.ts
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
import { createLwbaWsTransport } from '../../src/transport/lwba' // keep your existing path

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

describe('LWBA websocket transport', () => {
  test('message for non-activated instrument returns []', () => {
    const t = createLwbaWsTransport() as any
    const md = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, {
        Bid: { Px: dec(10000n, -2) },
        Offer: { Px: dec(10100n, -2) },
        Tm: 1_000_000n,
      } as any),
    } as any)
    const out = t.config.handlers.message(makeStreamBuffer(md))
    expect(out).toEqual([])
  })

  test('subscribe builder: first subscribe returns frame, subsequent subscribes return undefined', () => {
    const t = createLwbaWsTransport() as any
    const first = t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    const second = t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER })
    expect(first).toBeInstanceOf(Uint8Array)
    expect(second).toBeUndefined()
  })

  test('unsubscribe builder: removing last returns frame, otherwise undefined', () => {
    const t = createLwbaWsTransport() as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    t.config.builders.subscribeMessage({ market: MARKET, isin: OTHER })

    const removeOne = t.config.builders.unsubscribeMessage({ market: MARKET, isin: OTHER })
    expect(removeOne).toBeUndefined()

    const removeLast = t.config.builders.unsubscribeMessage({ market: MARKET, isin: ISIN })
    expect(removeLast).toBeInstanceOf(Uint8Array)
  })

  test('missing ISIN: handler returns []', () => {
    const t = createLwbaWsTransport() as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })
    const md = create(MarketDataSchema, {
      Dat: create(DataSchema, { Px: dec(100n, 0), Tm: 1_000_000n } as any),
    } as any)
    const out = t.config.handlers.message(makeStreamBuffer(md))
    expect(out).toEqual([])
  })

  test('quote then trade: emits only when complete and reflects cached fields and timestamps', () => {
    const t = createLwbaWsTransport() as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })

    // Quote (no latestPrice yet) -> should NOT emit
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(10000n, -2) },
      Offer: { Px: dec(10100n, -2) },
      Tm: 5_000_000n,
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd))
    expect(quoteRes).toEqual([])

    // Trade (now latestPrice arrives) -> should emit with full set
    const tradeDat = create(DataSchema, { Px: dec(9999n, -2), Tm: 6_000_000n } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd))

    expect(tradeRes.length).toBe(1)
    const [entry] = tradeRes
    const d = entry.response.data

    expect(d.bid).toBe(100)
    expect(d.ask).toBe(101)
    expect(d.mid).toBe(100.5)
    expect(d.latestPrice).toBe(99.99)
    expect(d.quoteProviderIndicatedTimeUnixMs).toBe(5)
    expect(d.tradeProviderIndicatedTimeUnixMs).toBe(6)
    expect(entry.response.timestamps.providerIndicatedTimeUnixMs).toBe(6)
  })

  test('bid-only then ask-only then trade → emits once both quote & trade are known', () => {
    const t = createLwbaWsTransport() as any
    t.config.builders.subscribeMessage({ market: MARKET, isin: ISIN })

    // bid-only
    const bidOnly = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, { Bid: { Px: dec(10000n, -2) }, Tm: 10_000_000n } as any),
    } as any)
    expect(t.config.handlers.message(makeStreamBuffer(bidOnly))).toEqual([])

    // ask-only
    const askOnly = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, { Offer: { Px: dec(10200n, -2) }, Tm: 11_000_000n } as any),
    } as any)
    expect(t.config.handlers.message(makeStreamBuffer(askOnly))).toEqual([])

    // trade → emit
    const trade = create(MarketDataSchema, {
      Instrmt: { Sym: ISIN },
      Dat: create(DataSchema, { Px: dec(10100n, -2), Tm: 12_000_000n } as any),
    } as any)
    const [entry] = t.config.handlers.message(makeStreamBuffer(trade))
    expect(entry.response.data.bid).toBe(100)
    expect(entry.response.data.ask).toBe(102)
    expect(entry.response.data.mid).toBe(101)
    expect(entry.response.data.latestPrice).toBe(101)
    expect(entry.response.data.quoteProviderIndicatedTimeUnixMs).toBe(11)
    expect(entry.response.data.tradeProviderIndicatedTimeUnixMs).toBe(12)
  })

  test('defensive decoding: bad buffer returns []', () => {
    const t = createLwbaWsTransport() as any
    const res = t.config.handlers.message(Buffer.from('not-a-protobuf'))
    expect(res).toEqual([])
  })

  test('open() refreshes TTL immediately and on interval', async () => {
    jest.useFakeTimers() // modern timers in your Jest config
    const t = createLwbaWsTransport() as any

    // stub framework bits
    const writeTTL = jest.fn()
    t.responseCache = { writeTTL }
    t.subscriptionSet = { getAll: jest.fn().mockResolvedValue([]) }

    const ctx = {
      adapterSettings: { WS_API_ENDPOINT: 'wss://example', API_KEY: 'key', CACHE_MAX_AGE: 45_000 },
    } as any

    await t.config.handlers.open({}, ctx)
    expect(writeTTL).toHaveBeenCalledTimes(1)

    // Advance one full interval AND await the async callback
    await jest.advanceTimersByTimeAsync(60_000)

    expect(writeTTL).toHaveBeenCalledTimes(2)

    jest.useRealTimers()
  })
})
