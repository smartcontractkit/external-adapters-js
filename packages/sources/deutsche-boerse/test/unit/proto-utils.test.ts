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
  isSingleQuoteFrame,
  isSingleTradeFrame,
  parseIsin,
  pickProviderTime,
} from '../../src/transport/proto-utils'

describe('proto-utils', () => {
  const dec = (m: bigint, e: number): Decimal => create(DecimalSchema, { m, e })

  test('decimalToNumber – basic fractional', () => {
    expect(decimalToNumber(dec(123n, -2))).toBeCloseTo(1.23)
  })

  test('decimalToNumber – integer scaling', () => {
    expect(decimalToNumber(dec(42n, 0))).toBe(42)
    expect(decimalToNumber(dec(42n, 1))).toBe(420)
  })

  // Boundary: exactly 15 significant digits passes
  test('decimalToNumber – exactly 15 significant digits passes', () => {
    expect(decimalToNumber(dec(999_999_999_999_999n, 0))).toBe(999_999_999_999_999)
  })

  // Fail: > 15 significant digits (16-digit mantissa)
  test('decimalToNumber – throws when value has > 15 significant digits', () => {
    expect(() => decimalToNumber(dec(1_234_567_890_123_456n, 0))).toThrow(
      /more than 15 significant digits/i,
    )
  })

  // Fail: still > 15 significant digits even after scaling (exponent doesn’t reduce sig-digits)
  test('decimalToNumber – throws for 16-digit mantissa with negative exponent', () => {
    expect(() => decimalToNumber(dec(1_234_567_890_123_456n, -5))).toThrow(
      /more than 15 significant digits/i,
    )
  })

  test('convertNsToMs', () => {
    expect(convertNsToMs(2_000_000n)).toBe(2)
    expect(convertNsToMs(1_999_999n)).toBe(1)
  })

  test('getIsin (uses Instrmt.Sym)', () => {
    const md: MarketData = create(MarketDataSchema, {
      Instrmt: { Sym: 'IE00B53L3W79' as string },
    } as any)
    expect(parseIsin(md)).toBe('IE00B53L3W79')
  })

  test('pickProviderTime', () => {
    const dat: Data = create(DataSchema, { Tm: 5_000_000n } as any)
    expect(pickProviderTime(dat)).toBe(5)
  })

  test('isSingleTradeFrame', () => {
    const datWithTrade: Data = create(DataSchema, { Px: dec(100n, -2) } as any)
    const datNoTrade: Data = create(DataSchema, {} as any)
    expect(isSingleTradeFrame(datWithTrade)).toBe(true)
    expect(isSingleTradeFrame(datNoTrade)).toBe(false)
  })

  test('isSingleQuoteFrame', () => {
    const datWithQuote: Data = create(DataSchema, {
      Bid: { Px: dec(10000n, -2) },
      Offer: { Px: dec(10050n, -2) },
    } as any)
    const datMissing: Data = create(DataSchema, { Bid: {} } as any)
    expect(isSingleQuoteFrame(datWithQuote)).toBe(true)
    expect(isSingleQuoteFrame(datMissing)).toBe(false)
  })
})
