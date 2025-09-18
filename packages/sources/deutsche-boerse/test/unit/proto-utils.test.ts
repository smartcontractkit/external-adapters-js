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
  getIsin,
  isSingleQuoteFrame,
  isSingleTradeFrame,
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

  test('decimalToNumber – mantissa overflow throws', () => {
    const tooBig = BigInt(Number.MAX_SAFE_INTEGER) + 1n
    expect(() => decimalToNumber(dec(tooBig, 0))).toThrow(/overflow/i)
  })

  test('convertNsToMs', () => {
    expect(convertNsToMs(2_000_000n)).toBe(2)
    expect(convertNsToMs(1_999_999n)).toBe(1)
  })

  test('getIsin (uses Instrmt.Sym)', () => {
    const md: MarketData = create(MarketDataSchema, {
      Instrmt: { Sym: 'IE00B53L3W79' as string },
    } as any)
    expect(getIsin(md)).toBe('IE00B53L3W79')
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
