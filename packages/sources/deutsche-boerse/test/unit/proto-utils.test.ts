// packages/sources/deutsche-boerse/test/unit/proto-utils.test.ts
import { create } from '@bufbuild/protobuf'
import {
  DataSchema,
  DecimalSchema,
  MarketDataSchema,
  type Data,
  type Decimal,
  type MarketData,
} from '../../src/gen/md_cef_pb'
import {
  convertNsToMs,
  decimalToNumber,
  hasSingleBidFrame,
  hasSingleOfferFrame,
  isSingleTradeFrame,
  parseIsin,
  pickProviderTime,
} from '../../src/transport/proto-utils'

describe('proto-utils', () => {
  const dec = (m: bigint, e: number): Decimal => create(DecimalSchema, { m, e })

  test('decimalToNumber – basic fractional and integer scaling', () => {
    expect(decimalToNumber(dec(123n, -2))).toBeCloseTo(1.23)
    expect(decimalToNumber(dec(42n, 0))).toBe(42)
    expect(decimalToNumber(dec(42n, 1))).toBe(420)
  })

  test('decimalToNumber – exactly 15 significant digits passes', () => {
    expect(decimalToNumber(dec(999_999_999_999_999n, 0))).toBe(999_999_999_999_999)
  })

  test('decimalToNumber – throws when value has > 15 significant digits', () => {
    expect(() => decimalToNumber(dec(1_234_567_890_123_456n, 0))).toThrow(
      /more than 15 significant digits/i,
    )
    expect(() => decimalToNumber(dec(1_234_567_890_123_456n, -5))).toThrow(
      /more than 15 significant digits/i,
    )
  })

  test('convertNsToMs', () => {
    expect(convertNsToMs(2_000_000n)).toBe(2)
    expect(convertNsToMs(1_999_999n)).toBe(1)
  })

  test('parseIsin uses Instrmt.Sym', () => {
    const md: MarketData = create(MarketDataSchema, {
      Instrmt: { Sym: 'IE00B53L3W79' as string },
    } as any)
    expect(parseIsin(md)).toBe('IE00B53L3W79')
  })

  test('pickProviderTime', () => {
    const dat: Data = create(DataSchema, { Tm: 5_000_000n } as any)
    expect(pickProviderTime(dat)).toBe(5)
  })

  test('frame guards: trade/bid/offer', () => {
    const datWithTrade: Data = create(DataSchema, { Px: dec(100n, -2) } as any)
    const datWithBid: Data = create(DataSchema, { Bid: { Px: dec(9999n, -2) } } as any)
    const datWithOffer: Data = create(DataSchema, { Offer: { Px: dec(10050n, -2) } } as any)
    const datEmpty: Data = create(DataSchema, {} as any)

    expect(isSingleTradeFrame(datWithTrade)).toBe(true)
    expect(isSingleTradeFrame(datEmpty)).toBe(false)

    expect(hasSingleBidFrame(datWithBid)).toBe(true)
    expect(hasSingleBidFrame(datEmpty)).toBe(false)

    expect(hasSingleOfferFrame(datWithOffer)).toBe(true)
    expect(hasSingleOfferFrame(datEmpty)).toBe(false)
  })
})
