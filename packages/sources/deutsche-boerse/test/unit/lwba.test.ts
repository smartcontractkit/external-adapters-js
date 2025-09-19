import { create, toBinary, type PlainMessage } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { StreamMessageSchema } from '../../src/gen/client_pb'
import {
  DataSchema,
  DecimalSchema,
  MarketDataSchema,
  type Decimal,
  type MarketData,
} from '../../src/gen/md_cef_pb'
import { createLwbaWsTransport } from '../../src/transport/lwba'
LoggerFactoryProvider.set()
const dec = (m: bigint, e: number): Decimal => create(DecimalSchema, { m, e })
const MARKET = 'md-xetraetfetp'

function makeStreamBuffer(md: PlainMessage<typeof MarketDataSchema> | MarketData): Buffer {
  const mdMsg = create(MarketDataSchema, md as any)

  // Build a proper google.protobuf.Any message
  const anyMsg = create(AnySchema, {
    typeUrl: `type.googleapis.com/${MarketDataSchema.typeName}`, // "dbag.cef.MarketData"
    value: toBinary(MarketDataSchema, mdMsg),
  })

  // Wrap in the stream envelope
  const sm = create(StreamMessageSchema, {
    subs: MARKET, // optional
    messages: [anyMsg],
  })

  return Buffer.from(toBinary(StreamMessageSchema, sm))
}
describe('LWBA transport (more integration cases)', () => {
  const ISIN = 'IE00B53L3W79'
  const OTHER = 'US0000000001'

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
    const out = t.config.handlers.message(makeStreamBuffer(md), {} as any)
    expect(out).toEqual([])
  })

  test('subscribe builder: first subscribe returns frame, subsequent subscribes return undefined', () => {
    const t = createLwbaWsTransport() as any
    const first = t.config.builders.subscribeMessage({ isin: ISIN })
    const second = t.config.builders.subscribeMessage({ isin: OTHER })

    expect(first).toBeInstanceOf(Uint8Array) // binary protobuf
    // Current implementation returns undefined for subsequent subscribes.
    // (Note: WebSocketTransport.sendMessages will throw if given undefined.)
    expect(second).toBeUndefined()
  })

  test('unsubscribe builder: removing last returns frame, otherwise undefined', () => {
    const t = createLwbaWsTransport() as any
    t.config.builders.subscribeMessage({ isin: ISIN })
    t.config.builders.subscribeMessage({ isin: OTHER })

    const removeOne = t.config.builders.unsubscribeMessage({ isin: OTHER })
    expect(removeOne).toBeUndefined()

    const removeLast = t.config.builders.unsubscribeMessage({ isin: ISIN })
    expect(removeLast).toBeInstanceOf(Uint8Array)
  })

  test('missing ISIN: handler returns []', () => {
    const t = createLwbaWsTransport() as any
    t.config.builders.subscribeMessage({ isin: ISIN })

    const md = create(MarketDataSchema, {
      // Instrmt missing Sym -> getIsin returns undefined
      Dat: create(DataSchema, { Px: dec(100n, 0), Tm: 1_000_000n } as any),
    } as any)

    const out = t.config.handlers.message(makeStreamBuffer(md), {} as any)
    expect(out).toEqual([])
  })

  test('quote then trade: response reflects cached fields and timestamps', () => {
    const t = createLwbaWsTransport() as any
    t.config.builders.subscribeMessage({ isin: ISIN })

    // Quote
    const quoteDat = create(DataSchema, {
      Bid: { Px: dec(10000n, -2) },
      Offer: { Px: dec(10100n, -2) },
      Tm: 5_000_000n,
    } as any)
    const quoteMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: quoteDat } as any)
    const quoteRes = t.config.handlers.message(makeStreamBuffer(quoteMd), {} as any)
    const [qEntry] = quoteRes
    expect(qEntry.response.data.bid).toBe(100)
    expect(qEntry.response.data.ask).toBe(101)
    expect(qEntry.response.data.mid).toBe(100.5)
    expect(qEntry.response.data.quoteProviderIndicatedTimeUnixMs).toBe(5)
    expect(qEntry.response.data.tradeProviderIndicatedTimeUnixMs).toBeNull()

    // Trade
    const tradeDat = create(DataSchema, { Px: dec(9999n, -2), Tm: 6_000_000n } as any)
    const tradeMd = create(MarketDataSchema, { Instrmt: { Sym: ISIN }, Dat: tradeDat } as any)
    const tradeRes = t.config.handlers.message(makeStreamBuffer(tradeMd), {} as any)
    const [tEntry] = tradeRes
    expect(tEntry.response.data.latestPrice).toBe(99.99)
    // quote time remains set; trade time now populated
    expect(tEntry.response.data.quoteProviderIndicatedTimeUnixMs).toBe(5)
    expect(tEntry.response.data.tradeProviderIndicatedTimeUnixMs).toBe(6)
  })
})
